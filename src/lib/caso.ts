/**
 * Cargar un caso, venga de donde venga.
 *
 * Hay dos orígenes y las pantallas no deberían saber cuál es cuál:
 *
 *   · Los CUATRO CASOS DE REFERENCIA viven en código. Son el guion del demo
 *     y la compuerta de calidad, y por eso sus páginas se pre-renderizan
 *     estáticas: en el video cargan instantáneo y no dependen de nada.
 *
 *   · Los CASOS EN VIVO viven en Supabase, creados desde una grabación. Su
 *     página se arma en el momento.
 *
 * La memoria se reconstruye desde la base pasando por `Memoria.agregar()`, no
 * inyectando el objeto: así el invariante se vuelve a aplicar al leer, no solo
 * al escribir. Si un hecho llegara sin origen —por una migración mal hecha, o
 * porque alguien tocó la tabla a mano— explota acá y no en el documento.
 */

import { Memoria, campo, valor, type Expediente, type Hecho, type OrigenTipo } from '../../motor/tipos';
import type { TipoCampoPreguntable } from '../../motor/compuertas';
import { casoPorId as fixturePorId, type CasoReferencia } from '../fixtures/casos';
import { supabase } from './supabase';

export interface CasoCargado {
  id: string;
  titulo: string;
  transcripcion: string;
  memoria: Memoria;
  hechos: Hecho[];
  expediente: Expediente;
  esReferencia: boolean;
  confianza: number | null;
}

function desdeFixture(c: CasoReferencia): CasoCargado {
  return {
    id: c.id,
    titulo: c.titulo,
    transcripcion: c.transcripcion,
    memoria: c.memoria,
    hechos: c.hechos,
    expediente: c.expediente,
    esReferencia: true,
    confianza: null,
  };
}

export async function cargarCaso(id: string): Promise<CasoCargado | null> {
  const fixture = fixturePorId(id);
  if (fixture) return desdeFixture(fixture);

  // No es de referencia: se busca en la base.
  const db = supabase();

  const { data: caso, error } = await db
    .from('casos')
    .select('id, transcripcion, expediente, confianza')
    .eq('id', id)
    .maybeSingle();

  if (error || !caso) return null;

  const { data: filas } = await db
    .from('hechos')
    .select('ref, contenido, origen_tipo, origen_ref, derivado_de')
    .eq('caso_id', id)
    .order('ref');

  const memoria = new Memoria();
  const hechos: Hecho[] = [];
  for (const f of filas ?? []) {
    hechos.push(
      memoria.agregar({
        id: f.ref,
        contenido: f.contenido,
        origen: {
          tipo: f.origen_tipo as OrigenTipo,
          ref: f.origen_ref,
          derivadoDe: (f.derivado_de as string[])?.length
            ? (f.derivado_de as string[])
            : undefined,
        },
      }),
    );
  }

  return {
    id: caso.id,
    titulo: 'Caso recibido por nota de voz',
    transcripcion: caso.transcripcion ?? '',
    memoria,
    hechos,
    expediente: (caso.expediente ?? {}) as Expediente,
    esReferencia: false,
    confianza: caso.confianza ?? null,
  };
}

/**
 * Los ocho campos que las compuertas pueden marcar INDETERMINADO — el
 * conjunto cerrado que `responderCaso` acepta. Nunca se confía en lo que
 * mande el cliente sin cruzarlo contra esta lista.
 */
const CAMPOS_PREGUNTABLES: Record<string, { etiqueta: string; tipo: TipoCampoPreguntable }> = {
  solicitanteEsTitular: { etiqueta: 'Si la persona afectada es quien presenta la tutela', tipo: 'booleano' },
  titularPuedeActuarPorSiMismo: { etiqueta: 'Si el titular puede actuar por sí mismo', tipo: 'booleano' },
  fechaVulneracion: { etiqueta: 'Fecha en que le negaron el servicio', tipo: 'fecha' },
  vulneracionContinua: { etiqueta: 'Si el servicio se lo siguen negando hoy', tipo: 'booleano' },
  urgenciaClinica: { etiqueta: 'Si su salud se deteriora mientras espera', tipo: 'booleano' },
  solicitudFormalPrevia: { etiqueta: 'Si ya pidió el servicio por escrito a la EPS', tipo: 'booleano' },
  tutelaPreviaMismosHechos: { etiqueta: 'Si ya había puesto una tutela antes por lo mismo', tipo: 'booleano' },
  hechosNuevos: { etiqueta: 'Si pasó algo nuevo después de esa tutela', tipo: 'booleano' },
};

export interface RespuestaEnviada {
  campo: string;
  tipoCampo: TipoCampoPreguntable;
  valor: boolean | string;
}

function humanizar(v: boolean | string, tipo: TipoCampoPreguntable): string {
  if (tipo === 'booleano') return v === true ? 'Sí' : 'No';
  const f = new Date(`${v}T12:00:00.000Z`);
  if (Number.isNaN(f.getTime())) return String(v);
  return f.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * La segunda ronda: responde las preguntas de `FALTAN_DATOS` sobre un caso
 * en vivo. Cada respuesta entra a la memoria como un `Hecho` propio, con su
 * origen declarado — mismo invariante que la extracción inicial, solo que
 * acá el origen dice `seguimiento:<campo>:<timestamp>` en vez de un minuto
 * de audio. Nunca toca los 4 casos de referencia (`esReferencia`).
 */
export async function responderCaso(
  id: string,
  respuestas: RespuestaEnviada[],
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (fixturePorId(id)) {
    return {
      ok: false,
      status: 409,
      error: 'Este es un caso de referencia y no se puede modificar aquí.',
    };
  }

  const cargado = await cargarCaso(id);
  if (!cargado) return { ok: false, status: 404, error: 'Caso no encontrado.' };

  const expedienteActualizado: Expediente = { ...cargado.expediente };
  const nuevosHechos: Hecho[] = [];
  let n = cargado.hechos.length;

  for (const r of respuestas) {
    const def = CAMPOS_PREGUNTABLES[r.campo];
    if (!def || def.tipo !== r.tipoCampo) continue; // fuera de la whitelist: se ignora
    const clave = r.campo as keyof Expediente;
    if (valor(expedienteActualizado[clave] as never) !== null) continue; // ya respondido, no se reabre
    if (def.tipo === 'booleano' && typeof r.valor !== 'boolean') continue;
    if (def.tipo === 'fecha' && (typeof r.valor !== 'string' || Number.isNaN(Date.parse(r.valor)))) continue;

    n += 1;
    const hechoId = `h${n}`;
    const hecho: Hecho = {
      id: hechoId,
      contenido: `${def.etiqueta}: ${humanizar(r.valor, def.tipo)}`,
      origen: { tipo: 'documento', ref: `seguimiento:${r.campo}:${new Date().toISOString()}` },
    };
    cargado.memoria.agregar(hecho);
    nuevosHechos.push(hecho);
    (expedienteActualizado as unknown as Record<string, unknown>)[clave] = campo(
      cargado.memoria,
      r.valor,
      hechoId,
    );
  }

  if (nuevosHechos.length === 0) return { ok: true };

  const db = supabase();

  const { error: errHechos } = await db.from('hechos').insert(
    nuevosHechos.map((h) => ({
      caso_id: id,
      ref: h.id,
      contenido: h.contenido,
      origen_tipo: h.origen.tipo,
      origen_ref: h.origen.ref,
      derivado_de: h.origen.derivadoDe ?? [],
    })),
  );
  if (errHechos) {
    return {
      ok: false,
      status: 500,
      error: `Un hecho no pasó el control de origen: ${errHechos.message}`,
    };
  }

  const { error: errCaso } = await db
    .from('casos')
    .update({ expediente: expedienteActualizado })
    .eq('id', id);
  if (errCaso) {
    return { ok: false, status: 500, error: `No se pudo guardar el expediente: ${errCaso.message}` };
  }

  return { ok: true };
}
