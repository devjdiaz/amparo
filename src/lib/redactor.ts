/**
 * AMPARO · El redactor.
 *
 * ---------------------------------------------------------------------------
 * DÓNDE ESTÁ LA FRONTERA DEL MODELO
 *
 * El modelo recibe una decisión YA TOMADA y unos hechos YA VERIFICADOS. No
 * evalúa procedibilidad, no calcula nada y —esto es lo importante— NO ESCRIBE
 * LA SECCIÓN DE JURISPRUDENCIA. Esa la arma el código a partir de lo que el
 * recuperador entregó.
 *
 * Eso no es una instrucción del prompt que el modelo pueda desobedecer: es la
 * forma del programa. El modelo devuelve `hechos` y `pretensiones`, y no hay
 * un campo donde pudiera meter una sentencia aunque quisiera. No le pedimos
 * que no invente citas — le quitamos el lugar donde ponerlas.
 *
 * Si se le quitara el modelo por completo, la decisión sería idéntica y la
 * tutela saldría igual, más fea. Eso es lo que demuestra el interruptor 2.
 * ---------------------------------------------------------------------------
 *
 * Orden de los caminos, y el orden importa:
 *
 *   1. MODO_FIXTURE encendido → texto determinístico, sin tocar la red.
 *   2. Sin llave configurada  → texto determinístico, y se declara por qué.
 *   3. Con llave              → el modelo, auditado por el validador.
 *
 * El fallback no es un plan B: es el camino por defecto. El modelo es el lujo
 * de cuando hay conexión.
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import type { Expediente, Memoria } from '../../motor/tipos';
import { valor } from '../../motor/tipos';
import type { Fuerza } from '../../motor/fuerza';
import type { Recuperacion } from '../../motor/recuperador';
import { idsCitados } from '../../motor/recuperador';
import {
  recortarOfensoras,
  validarRedaccion,
  type Validacion,
} from '../../motor/validador';
import { redactarDeterministico } from './redactor-deterministico';
import { MODO_FIXTURE, tieneAnthropic } from './entorno';

export const MODELO = 'claude-opus-5';

export interface Redaccion {
  texto: string;
  fuente: 'modelo' | 'deterministica';
  validacion: Validacion | null;
  /** Si se intentó el modelo y no se usó, por qué. Viaja en la respuesta. */
  motivoFallback?: string;
  /** Si hubo que recortar oraciones que no pasaron la aduana. Se declara. */
  recortada?: boolean;
  modelo?: string;
  tokens?: { entrada: number; salida: number };
}

// ---------------------------------------------------------------------------
// El contrato de salida. Nótese lo que NO tiene: un campo para citas.
// ---------------------------------------------------------------------------

const Salida = z.object({
  hechos: z
    .array(z.string())
    .describe(
      'Los hechos numerados PRIMERO, SEGUNDO, TERCERO... Cada oración termina con la marca del hecho que la sustenta, así: [#h1]. Una oración sin marca es un error.',
    ),
  pretensiones: z
    .array(z.string())
    .describe('Lo que se le pide al juez, numerado PRIMERA, SEGUNDA...'),
});

// ---------------------------------------------------------------------------
// El prompt
// ---------------------------------------------------------------------------

const SISTEMA = `Redactás la sección de hechos y las pretensiones de una acción de tutela colombiana.

Quien lee es un juez de tutela que va a decidir en diez días hábiles y tiene decenas de expedientes encima. Necesita entender los hechos rápido y sin ambigüedad.

Recibís hechos YA VERIFICADOS y una decisión de procedibilidad YA TOMADA. Tu único trabajo es redactarlos. No evalúes si la tutela procede, no agregues hechos, no cites jurisprudencia y no supongas nada que no venga en la entrada.

LA REGLA QUE NO SE ROMPE
Cada oración de la sección de hechos lleva, ANTES DEL PUNTO FINAL, la marca del hecho que la sustenta.

  Así:  PRIMERO. El médico tratante ordenó la cita con neurología [#h6].
  Así NO: PRIMERO. El médico tratante ordenó la cita con neurología. [#h6]

La diferencia importa: la marca es parte de la oración, no una nota al pie. Una marca suelta después del punto deja la oración sin respaldo, y un validador la recorta del documento.

Si una oración se apoya en dos hechos, van las dos marcas juntas antes del punto: ... con neurología [#h6][#h2].
Solo podés usar las marcas que vienen en la entrada. Una marca inventada es peor que una oración de menos.

CÓMO ESCRIBIR
- Español de Colombia, registro jurídico formal. Este texto va dentro del documento, no en una pantalla: acá "subsidiariedad" y "perjuicio irremediable" están bien.
- Tercera persona no; primera persona: lo firma el accionante.
- Los hechos van numerados PRIMERO, SEGUNDO, TERCERO, en orden cronológico.
- Una idea por hecho. Frases cortas, voz activa.
- Las fechas y las cifras van EXACTAS como vienen. No las recalcules ni las redondees.

QUÉ NO HACER
- No escribas encabezados ni títulos de sección: el documento ya los tiene.
- Nada de "cabe destacar", "es importante mencionar", "en aras de".
- No adjetives la conducta de la EPS ("negligente", "arbitraria"). Narrá lo que pasó; calificar es trabajo del juez.
- No prometas que la tutela va a prosperar.
- No menciones ninguna sentencia, ningún número de radicado de sentencia, ni "la Corte ha dicho". Los fundamentos de derecho los arma otro componente con las sentencias que un recuperador verificó. Si mencionás una, se cae la garantía central del sistema.`;

// ---------------------------------------------------------------------------
// Insumos: SOLO lo que el modelo puede afirmar
// ---------------------------------------------------------------------------

function insumos(exp: Expediente, fuerza: Fuerza | null, memoria: Memoria): string {
  /** Cada campo viaja con su marca, para que el modelo sepa cuál usar. */
  const campo = <T,>(c: { valor: T; hecho: string } | null) =>
    c ? { valor: c.valor, marca: `[#${c.hecho}]` } : null;

  return JSON.stringify(
    {
      instruccion:
        'Redactá los hechos y las pretensiones. Cada oración de hechos termina con su marca.',
      marcasDisponibles: memoria.todos().map((h) => ({
        marca: `[#${h.id}]`,
        dice: h.contenido,
        origen: h.origen.ref,
      })),
      expediente: {
        servicio: campo(exp.servicio),
        tipoNegacion: campo(exp.tipoNegacion),
        entidad: campo(exp.entidad),
        fechaVulneracion: campo(exp.fechaVulneracion),
        vulneracionContinua: campo(exp.vulneracionContinua),
        solicitudFormalPrevia: campo(exp.solicitudFormalPrevia),
        ordenMedicaVigente: campo(exp.ordenMedicaVigente),
        negacionDocumentada: campo(exp.negacionDocumentada),
        urgenciaClinica: campo(exp.urgenciaClinica),
        sujetoEspecialProteccion: campo(exp.sujetoEspecialProteccion),
        diasEspera: campo(exp.diasEspera),
        diasReglamentarios: campo(exp.diasReglamentarios),
      },
      // Lo único que la fuerza aporta al texto: si se pide medida provisional.
      pedirMedidaProvisional: fuerza?.postura === 'MEDIDA_PROVISIONAL',
    },
    null,
    2,
  );
}

/**
 * Solo lo que el modelo escribió. Es lo que se audita.
 *
 * Los títulos de sección NO van acá a propósito. Los pone el código, no el
 * modelo, así que no tienen por qué llevar marca ni pasar por la aduana. La
 * primera versión los metía en el texto validable y el recorte se los comía:
 * el documento salía sin "I. HECHOS" ni "II. PRETENSIONES", que es un
 * desastre en un escrito que va ante un juez.
 *
 * Regla general: el validador audita lo que el modelo afirma, no la
 * estructura que nosotros imponemos.
 */
function textoAuditable(s: z.infer<typeof Salida>): {
  hechos: string;
  pretensiones: string;
} {
  return { hechos: s.hechos.join('\n'), pretensiones: s.pretensiones.join('\n') };
}

/** Arma el documento final, ya con la estructura puesta por nosotros. */
function conEstructura(hechos: string, pretensiones: string): string {
  return ['I. HECHOS', '', hechos, '', 'II. PRETENSIONES', '', pretensiones].join('\n');
}

// ---------------------------------------------------------------------------
// El redactor
// ---------------------------------------------------------------------------

export interface OpcionesRedactor {
  expediente: Expediente;
  memoria: Memoria;
  fuerza: Fuerza | null;
  recuperacion: Recuperacion | null;
  /** Interruptor 2. En false ni se intenta el modelo. */
  llmActivo?: boolean;
  /** Para ensayar el modelo aunque MODO_FIXTURE esté encendido. */
  forzarModelo?: boolean;
}

export async function redactar(o: OpcionesRedactor): Promise<Redaccion> {
  const respaldo = redactarDeterministico(o.expediente, o.fuerza);

  // Interruptor 2 apagado: ni se intenta.
  if (o.llmActivo === false) {
    return { texto: respaldo, fuente: 'deterministica', validacion: null };
  }

  const usarModelo = o.forzarModelo === true || !MODO_FIXTURE;

  if (!usarModelo) {
    return {
      texto: respaldo,
      fuente: 'deterministica',
      validacion: null,
      motivoFallback: 'MODO_FIXTURE encendido: nada del camino del demo toca la red.',
    };
  }

  if (!tieneAnthropic()) {
    return {
      texto: respaldo,
      fuente: 'deterministica',
      validacion: null,
      motivoFallback: 'Sin ANTHROPIC_API_KEY configurada.',
    };
  }

  const permitidas = o.recuperacion ? idsCitados(o.recuperacion) : [];

  try {
    const cliente = new Anthropic({ timeout: 90_000, maxRetries: 1 });

    const pedir = async (extra?: string) =>
      cliente.messages.parse({
        model: MODELO,
        max_tokens: 16_000,
        system: SISTEMA,
        messages: [
          {
            role: 'user',
            content: extra
              ? `${insumos(o.expediente, o.fuerza, o.memoria)}\n\n${extra}`
              : insumos(o.expediente, o.fuerza, o.memoria),
          },
        ],
        output_config: { format: zodOutputFormat(Salida), effort: 'medium' },
      });

    let respuesta = await pedir();
    if (respuesta.stop_reason === 'refusal' || !respuesta.parsed_output) {
      return {
        texto: respaldo,
        fuente: 'deterministica',
        validacion: null,
        motivoFallback: `El modelo no devolvió una redacción utilizable (${respuesta.stop_reason}).`,
      };
    }

    // Se audita SOLO lo que el modelo escribió. La estructura se pone después.
    let partes = textoAuditable(respuesta.parsed_output);
    let auditable = `${partes.hechos}\n${partes.pretensiones}`;
    let validacion = validarRedaccion(auditable, o.memoria, permitidas);

    // --- Un reintento, devolviéndole al modelo sus propias violaciones.
    if (!validacion.ok) {
      const reclamo =
        'La redacción anterior no pasó la validación. Corregí ESTO y devolvé la redacción completa:\n' +
        validacion.violaciones
          .map((v) => `- ${v.tipo}: ${v.detalle}\n  en: "${v.fragmento}"`)
          .join('\n');

      respuesta = await pedir(reclamo);
      if (respuesta.parsed_output) {
        partes = textoAuditable(respuesta.parsed_output);
        auditable = `${partes.hechos}\n${partes.pretensiones}`;
        validacion = validarRedaccion(auditable, o.memoria, permitidas);
      }
    }

    // --- Si sigue fallando, se recorta lo ofensor y QUEDA DECLARADO.
    //     Nunca pasa en silencio.
    let recortada = false;
    if (!validacion.ok) {
      const recortado = recortarOfensoras(auditable, validacion);

      // Red de seguridad: un documento destrozado es PEOR que uno feo.
      //
      // La primera vez que esto corrió contra el modelo real, el recorte dejó
      // un texto que eran solo marcas —"[#h1] [#h6] [#h2]…"— porque el modelo
      // ponía las marcas después del punto y cada oración quedaba huérfana.
      // Técnicamente pasaba la validación: cero afirmaciones sin respaldo,
      // porque no quedaba ninguna afirmación. Un juez habría recibido basura.
      //
      // Si el recorte se llevó más de la mitad, no se publica: se cae entero
      // al determinístico, que es feo pero está completo y es correcto.
      const sobrevivio = recortado.length / Math.max(auditable.length, 1);
      if (sobrevivio < 0.5) {
        return {
          texto: respaldo,
          fuente: 'deterministica',
          validacion,
          motivoFallback:
            `La redacción del modelo no pasó la aduana y el recorte habría dejado ` +
            `solo el ${Math.round(sobrevivio * 100)}% del texto. Se usa la plantilla, ` +
            `que está completa.`,
        };
      }

      auditable = recortado;
      validacion = validarRedaccion(auditable, o.memoria, permitidas);
      // Tras el recorte no se puede saber qué quedó de cada sección, así que
      // el texto recortado va entero bajo HECHOS y las pretensiones se dejan
      // al determinístico. Feo, pero honesto y completo.
      partes = { hechos: auditable, pretensiones: '' };
      recortada = true;
    }

    return {
      texto: conEstructura(
        partes.hechos,
        partes.pretensiones || 'PRIMERA. Que se tutele el derecho fundamental a la salud y se ordene la prestación inmediata del servicio requerido.',
      ),
      fuente: 'modelo',
      validacion,
      recortada,
      modelo: respuesta.model,
      tokens: {
        entrada: respuesta.usage.input_tokens,
        salida: respuesta.usage.output_tokens,
      },
    };
  } catch (e) {
    // Nunca se propaga. La tutela ya está decidida; la redacción bonita es
    // un lujo, y el demo no se puede caer porque se cayó una API.
    return {
      texto: respaldo,
      fuente: 'deterministica',
      validacion: null,
      motivoFallback: e instanceof Error ? e.message : String(e),
    };
  }
}
