/**
 * AMPARO · Extracción.
 *
 * Paso [2] del flujo: del texto hablado al expediente estructurado.
 *
 * ---------------------------------------------------------------------------
 * ACÁ EL MODELO SÍ HACE UN TRABAJO DE VERDAD, Y HAY QUE SER HONESTOS
 *
 * Convertir "me dijeron que no, y eso fue el doce de julio" en
 * `fechaVulneracion: '2026-07-12'` no lo hace una expresión regular. Lo hace
 * un modelo, y eso está bien: interpretar lenguaje es exactamente para lo que
 * sirve.
 *
 * Lo que NO hace, y es la diferencia:
 *
 *   · No decide si la tutela procede. Eso lo hacen las compuertas, después.
 *   · No puede afirmar nada sin anclarlo. Cada campo del expediente apunta a
 *     un hecho, y cada hecho apunta a un segundo del audio. Si el modelo
 *     inventa un dato, tiene que inventar también el hecho que lo sostiene y
 *     el segundo en que se dijo — y eso es contrastable: alguien abre el
 *     audio, salta a ese punto y escucha.
 *   · No puede referirse a un hecho que no creó: `campo()` lanza si el id no
 *     está en la memoria. El invariante lo hace cumplir el código, no el
 *     prompt.
 *
 * Un dato mal extraído es un error recuperable: se ve en pantalla con su
 * origen, y quien opera lo corrige. Un dato inventado sin origen no puede
 * existir.
 * ---------------------------------------------------------------------------
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { campo, expedienteVacio, Memoria, type Expediente, type Hecho } from '../../motor/tipos';
import { refDeAudio, type Segmento } from './transcribir';
import { MODELO } from './redactor';

// ---------------------------------------------------------------------------
// Contrato de salida
// ---------------------------------------------------------------------------

const Anclado = <T extends z.ZodTypeAny>(valor: T) =>
  z
    .object({
      valor,
      hecho: z.string().describe('El id del hecho que lo sostiene, p. ej. "h3"'),
    })
    .nullable();

const Extraccion = z.object({
  hechos: z
    .array(
      z.object({
        id: z.string().describe('h1, h2, h3... en orden'),
        contenido: z
          .string()
          .describe('El hecho en una oración clara, en tercera persona'),
        segundo: z
          .number()
          .describe('Segundo del audio donde se dijo. Sale de los segmentos, no se estima.'),
      }),
    )
    .describe('Todo lo que la persona afirmó. Un hecho por afirmación.'),

  // --- Lo que necesitan las compuertas
  solicitanteEsTitular: Anclado(z.boolean()),
  titularPuedeActuarPorSiMismo: Anclado(z.boolean()),
  fechaVulneracion: Anclado(z.string().describe('YYYY-MM-DD')),
  vulneracionContinua: Anclado(z.boolean()),
  solicitudFormalPrevia: Anclado(z.boolean()),
  urgenciaClinica: Anclado(z.boolean()),
  tutelaPreviaMismosHechos: Anclado(z.boolean()),
  hechosNuevos: Anclado(z.boolean()),

  // --- Lo que necesita la fuerza del caso
  sujetoEspecialProteccion: Anclado(z.string()),
  ordenMedicaVigente: Anclado(z.boolean()),
  negacionDocumentada: Anclado(z.boolean()),
  diasEspera: Anclado(z.number()),
  diasReglamentarios: Anclado(z.number()),

  // --- Lo que necesita el recuperador
  servicio: Anclado(z.string()),
  tipoNegacion: Anclado(z.string()),
  entidad: Anclado(z.string()),
});

const SISTEMA = `Convertís lo que una persona contó en voz alta sobre un problema con su EPS en un expediente estructurado.

NO decidís si la tutela procede. Eso lo hace un motor de reglas después, con lo que vos extraigas. Tu trabajo es leer y estructurar, no evaluar.

LA REGLA QUE NO SE ROMPE
Cada campo del expediente apunta a un hecho, y cada hecho apunta al segundo del audio donde se dijo. Si no podés señalar dónde lo dijo, el campo va en null.

null NO es un fracaso: es la respuesta correcta cuando la persona no lo dijo. El sistema sabe preguntar lo que falta. Un dato inventado, en cambio, puede costarle a alguien que le rechacen la tutela.

CÓMO EXTRAER
- Un hecho por afirmación. Frases cortas, en tercera persona: "El médico tratante ordenó una cita con neurología."
- El "segundo" sale de los segmentos que te doy. No lo estimes ni lo redondees a ojo.
- Las fechas se resuelven contra la FECHA DE HOY que te doy. "el doce de julio" con hoy = 15 de agosto de 2026 es 2026-07-12. Si el mes ya pasó este año, es de este año; si sería futuro, es del año pasado.
- diasEspera se calcula desde fechaVulneracion hasta hoy. Solo si tenés la fecha.
- diasReglamentarios: solo si la persona lo menciona. Casi nunca lo va a saber. Normalmente null.

CAMPOS DELICADOS
- tutelaPreviaMismosHechos: si la persona dice "nunca he puesto una tutela", eso es false y sí tiene hecho. Si NO lo menciona, es null. Nunca lo asumas: la temeridad acarrea sanción.
- solicitanteEsTitular: true si habla de sí misma. false si dice "es para mi mamá", "es para mi hijo".
- urgenciaClinica: true solo si menciona dolor, deterioro, o que empeora esperando. "Es de control" o "no me duele" es false.
- solicitudFormalPrevia: true solo si pidió el servicio de manera formal a la entidad. Ir a la ventanilla y que le digan que no cuenta como solicitud; que le hayan respondido por escrito o que tenga radicado, más. Si dice "por escrito no he pedido nada", es false.
- sujetoEspecialProteccion: menor de edad, mayor de 60, gestante, discapacidad, o enfermedad catastrófica. Va con la razón: "adulto mayor, 71 años".`;

// ---------------------------------------------------------------------------

export interface Extraido {
  memoria: Memoria;
  hechos: Hecho[];
  expediente: Expediente;
  /** Campos que quedaron en null. Son las preguntas que el motor va a hacer. */
  sinDato: string[];
  tokens: { entrada: number; salida: number };
}

export async function extraer(
  texto: string,
  segmentos: Segmento[],
  hoy: Date,
  /**
   * De dónde entró el relato. Importa: si la persona ESCRIBIÓ, marcar los
   * hechos como `audio:00:00` sería una mentira pequeña sobre la procedencia
   * — y este sistema existe para no mentir sobre la procedencia. Un hecho
   * escrito se declara escrito.
   */
  entradaPor: 'audio' | 'escrito' = 'audio',
): Promise<Extraido> {
  const cliente = new Anthropic({ timeout: 90_000, maxRetries: 1 });

  const entrada = JSON.stringify(
    {
      fechaDeHoy: hoy.toISOString().slice(0, 10),
      transcripcion: texto,
      segmentos: segmentos.map((s) => ({
        segundo: Math.round(s.inicio),
        dijo: s.texto,
      })),
    },
    null,
    2,
  );

  const r = await cliente.messages.parse({
    model: MODELO,
    max_tokens: 8_000,
    system: SISTEMA,
    messages: [{ role: 'user', content: entrada }],
    output_config: { format: zodOutputFormat(Extraccion), effort: 'medium' },
  });

  if (!r.parsed_output) {
    throw new Error(`El extractor no devolvió un expediente utilizable (${r.stop_reason}).`);
  }

  const salida = r.parsed_output;

  // --- La memoria. Acá se aplica el invariante: un hecho sin origen no entra.
  const memoria = new Memoria();
  const hechos: Hecho[] = [];
  for (const h of salida.hechos) {
    hechos.push(
      memoria.agregar({
        id: h.id,
        contenido: h.contenido,
        origen:
          entradaPor === 'audio'
            ? { tipo: 'audio', ref: refDeAudio(h.segundo) }
            : { tipo: 'documento', ref: 'escrito:formulario' },
      }),
    );
  }

  // --- El expediente. `campo()` lanza si el modelo apuntó a un hecho que no
  //     creó, así que una referencia inventada no puede llegar al motor.
  const sinDato: string[] = [];
  const anclar = <T>(
    nombre: string,
    v: { valor: T; hecho: string } | null,
  ): { valor: T; hecho: string } | null => {
    if (!v) {
      sinDato.push(nombre);
      return null;
    }
    try {
      return campo(memoria, v.valor, v.hecho);
    } catch {
      // El modelo apuntó a un hecho inexistente. Se descarta el campo entero:
      // es preferible que el motor pregunte a que decida sobre un dato huérfano.
      sinDato.push(nombre);
      return null;
    }
  };

  const expediente: Expediente = {
    ...expedienteVacio,
    solicitanteEsTitular: anclar('solicitanteEsTitular', salida.solicitanteEsTitular),
    titularPuedeActuarPorSiMismo: anclar(
      'titularPuedeActuarPorSiMismo',
      salida.titularPuedeActuarPorSiMismo,
    ),
    fechaVulneracion: anclar('fechaVulneracion', salida.fechaVulneracion),
    vulneracionContinua: anclar('vulneracionContinua', salida.vulneracionContinua),
    solicitudFormalPrevia: anclar('solicitudFormalPrevia', salida.solicitudFormalPrevia),
    urgenciaClinica: anclar('urgenciaClinica', salida.urgenciaClinica),
    tutelaPreviaMismosHechos: anclar(
      'tutelaPreviaMismosHechos',
      salida.tutelaPreviaMismosHechos,
    ),
    hechosNuevos: anclar('hechosNuevos', salida.hechosNuevos),
    sujetoEspecialProteccion: anclar(
      'sujetoEspecialProteccion',
      salida.sujetoEspecialProteccion,
    ),
    ordenMedicaVigente: anclar('ordenMedicaVigente', salida.ordenMedicaVigente),
    negacionDocumentada: anclar('negacionDocumentada', salida.negacionDocumentada),
    diasEspera: anclar('diasEspera', salida.diasEspera),
    diasReglamentarios: anclar('diasReglamentarios', salida.diasReglamentarios),
    servicio: anclar('servicio', salida.servicio),
    tipoNegacion: anclar('tipoNegacion', salida.tipoNegacion),
    entidad: anclar('entidad', salida.entidad),
  };

  return {
    memoria,
    hechos,
    expediente,
    sinDato,
    tokens: { entrada: r.usage.input_tokens, salida: r.usage.output_tokens },
  };
}
