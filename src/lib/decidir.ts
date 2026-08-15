/**
 * AMPARO · El orquestador. De un expediente a una decisión completa.
 *
 * ---------------------------------------------------------------------------
 * EL ORDEN ES LA REGLA, no un detalle de implementación:
 *
 *     compuertas → fuerza → recuperador → certificado
 *
 *   1. Las compuertas corren PRIMERO y son conjuntivas. Si no procede, no se
 *      calcula fuerza, no se recupera jurisprudencia y no se invoca al modelo:
 *      ya está resuelto, y seguir gastando sería desperdicio.
 *   2. La fuerza NUNCA niega. Solo decide si se pide medida provisional, qué
 *      se prioriza al recuperar y qué pruebas se le sugieren a la persona.
 *      Un caso de 18/100 procede exactamente igual que uno de 92/100.
 *   3. El recuperador es determinístico y puede devolver CERO. Preferimos una
 *      tutela sin jurisprudencia, y decirlo, que una con una sentencia traída
 *      de los pelos.
 *   4. El certificado se emite SIEMPRE — proceda, no proceda o falten datos.
 *      Un certificado que solo aparece en el éxito no es auditoría.
 *
 * Nada de esto toca la red ni el modelo. El LLM entra después, en el redactor,
 * y por eso el interruptor 2 puede apagarlo sin que el veredicto se mueva.
 * ---------------------------------------------------------------------------
 */

import {
  evaluarProcedibilidad,
  type Procedibilidad,
  type RutaAlterna,
  type Salida,
} from '../../motor/compuertas';
import { calcularFuerza, type Fuerza } from '../../motor/fuerza';
import {
  construirConsulta,
  filtrarCandidatas,
  type Recuperacion,
} from '../../motor/recuperador';
import {
  emitirCertificado,
  MOTOR_VERSION,
  type Certificado,
  type Interruptores,
} from '../../motor/certificado';
import { hashDeReglas } from '../../motor/huella';
import type { Expediente, Hecho } from '../../motor/tipos';
import { candidatasPara, sentenciasVencidas, CORPUS_VERSION } from './corpus';
import { REGLAS_DECLARADAS } from './reglas';

/** Un paso de la ruta de decisión, con su marca de tiempo. Va a pantalla 5. */
export interface PasoRuta {
  paso: string;
  detalle: string;
  ms: number;
  /** Las cuatro compuertas se pintan distinto que el resto. */
  esCompuerta: boolean;
}

export interface Decision {
  casoId: string;
  fechaCorte: string;
  salida: Salida;

  procedibilidad: Procedibilidad;
  /** null cuando no procede o faltan datos: la fuerza solo se calcula si pasó. */
  fuerza: Fuerza | null;
  /** null cuando no procede, faltan datos, o el recuperador está apagado. */
  recuperacion: Recuperacion | null;

  /** Solo en NO_PROCEDE. Nunca un no seco. */
  rutas: RutaAlterna[];
  /** Solo en FALTAN_DATOS. La pregunta exacta que hay que hacerle. */
  preguntas: string[];

  hechos: Hecho[];
  interruptores: Interruptores;
  certificado: Certificado;
  rutaDecision: PasoRuta[];

  /** Sentencias del corpus sin verificar hace demasiado. Se declara. */
  corpusVencido: string[];
}

export interface OpcionesDecision {
  casoId: string;
  hoy: Date;
  interruptores?: Partial<Interruptores>;
}

export function decidir(
  exp: Expediente,
  hechos: Hecho[],
  opciones: OpcionesDecision,
): Decision {
  const t0 = Date.now();
  const ruta: PasoRuta[] = [];
  const anotar = (paso: string, detalle: string, esCompuerta = false) =>
    ruta.push({ paso, detalle, ms: Date.now() - t0, esCompuerta });

  const interruptores: Interruptores = {
    recuperadorActivo: opciones.interruptores?.recuperadorActivo ?? true,
    llmActivo: opciones.interruptores?.llmActivo ?? true,
  };

  anotar(
    'Memoria de hechos',
    `${hechos.length} hechos, todos con origen declarado`,
  );

  // -------------------------------------------------------------------------
  // 1 · Compuertas. Las cuatro, siempre, sin corto circuito: un no llega con
  //     todas sus razones, no con la primera que aparezca.
  // -------------------------------------------------------------------------
  const procedibilidad = evaluarProcedibilidad(exp, opciones.hoy);
  for (const c of procedibilidad.compuertas) {
    anotar(
      capitalizar(c.regla),
      `${c.motivo} → ${c.veredicto}`,
      true,
    );
  }

  // -------------------------------------------------------------------------
  // 2 · Fuerza. Solo si pasó. Y no decide si procede — nunca lo hizo.
  // -------------------------------------------------------------------------
  let fuerza: Fuerza | null = null;
  if (procedibilidad.salida === 'PROCEDE') {
    fuerza = calcularFuerza(exp);
    anotar(
      'Fuerza del caso',
      `${fuerza.total}/100 → ${fuerza.postura.toLowerCase().replace(/_/g, ' ')}`,
    );
  }

  // -------------------------------------------------------------------------
  // 3 · Recuperación. Determinística, y cero es un resultado válido.
  // -------------------------------------------------------------------------
  let recuperacion: Recuperacion | null = null;

  if (procedibilidad.salida === 'PROCEDE' && fuerza) {
    if (!interruptores.recuperadorActivo) {
      // Interruptor 1 apagado. No se recupera nada, y se dice — el sistema
      // deja de citar en vez de inventar. El vacío declarado es el argumento.
      anotar('Recuperación', 'recuperador apagado — sin fuente verificable, no se cita');
    } else {
      const consulta = construirConsulta(exp, fuerza);
      const candidatas = candidatasPara(consulta);
      recuperacion = filtrarCandidatas(consulta, candidatas, {
        fuentesConsultadas: [
          `corpus de sentencias T- de salud (v${CORPUS_VERSION})`,
        ],
      });
      anotar(
        'Recuperación',
        `${recuperacion.citadas.length} citadas de ${recuperacion.evaluadas} evaluadas`,
      );
    }
  } else {
    // Regla del valor de la información: si ya está resuelto, no se consulta.
    anotar(
      'Recuperación',
      `omitida — las compuertas ya resolvieron el caso (${procedibilidad.salida})`,
    );
  }

  // -------------------------------------------------------------------------
  // 4 · Certificado. Siempre.
  // -------------------------------------------------------------------------
  const certificado = emitirCertificado({
    casoId: opciones.casoId,
    reglasHash: hashDeReglas(REGLAS_DECLARADAS),
    corpusVersion: CORPUS_VERSION,
    procedibilidad,
    fuerza,
    recuperacion,
    validacion: null, // lo llena el redactor cuando corre
    interruptores,
    ahora: opciones.hoy,
  });
  anotar('Certificado', `emitido · huella ${certificado.huella.slice(0, 12)}…`);

  return {
    casoId: opciones.casoId,
    fechaCorte: opciones.hoy.toISOString(),
    salida: procedibilidad.salida,
    procedibilidad,
    fuerza,
    recuperacion,
    rutas: procedibilidad.rutas,
    preguntas: procedibilidad.preguntas,
    hechos,
    interruptores,
    certificado,
    rutaDecision: ruta,
    corpusVencido: sentenciasVencidas(opciones.hoy),
  };
}

function capitalizar(regla: string): string {
  const s = regla.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const VERSION = MOTOR_VERSION;
