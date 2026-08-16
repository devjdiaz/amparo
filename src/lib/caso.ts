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

import { Memoria, type Expediente, type Hecho, type OrigenTipo } from '../../motor/tipos';
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
