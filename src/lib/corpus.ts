/**
 * Puente entre el corpus verificado y el recuperador del motor.
 *
 * El corpus vive en `data/corpus.ts` — versionado, con cita textual y fecha de
 * verificación por sentencia. Acá se indexa una sola vez y se convierte cada
 * sentencia en una `Candidata` con su puntaje y con la frase que explica por
 * qué puntuó lo que puntuó.
 *
 * Determinístico y sin red: la misma consulta sobre el mismo corpus devuelve
 * siempre lo mismo. Eso es lo que hace auditable al recuperador, y es lo que
 * permite que el interruptor 1 demuestre algo.
 */

import { CORPUS, CORPUS_VERSION, type SentenciaCorpus } from '../../data/corpus';
import { Indice, explicarPuntaje, type Puntuable } from '../../motor/similitud';
import type { Candidata } from '../../motor/recuperador';

export { CORPUS_VERSION };

/** Se indexa una vez por proceso: el IDF no cambia mientras el corpus no cambie. */
const indice = new Indice(CORPUS as Puntuable[]);

export function tamanoCorpus(): number {
  return indice.tamano;
}

/**
 * Convierte el corpus en candidatas puntuadas para una consulta.
 *
 * Devuelve TODAS las sentencias con puntaje mayor que cero, no solo las
 * buenas: filtrar por umbral es trabajo de `filtrarCandidatas`, que además
 * registra el motivo de cada descarte. Acá solo se puntúa.
 *
 * `etiquetasRequeridas` es un gate previo: si se pasa, una sentencia solo
 * compite cuando alguna de sus etiquetas cruza. Es la red que impide que un
 * puntaje alto por casualidad léxica termine en una cita fuera de tema.
 */
export function candidatasPara(
  consulta: string,
  opciones: { etiquetasRequeridas?: readonly string[] } = {},
): Candidata[] {
  return indice
    .buscar(consulta, opciones)
    .filter((r) => r.puntaje.similitud > 0)
    .map((r) => {
      const s = r.sentencia as SentenciaCorpus;
      return {
        similitud: r.puntaje.similitud,
        explicacion: explicarPuntaje(r.puntaje),
        sentencia: {
          id: s.id,
          url: s.url,
          tema: s.tema,
          subregla: s.subregla,
          textual: s.textual,
          etiquetas: s.etiquetas,
          verificadaEl: s.verificadaEl,
        },
      };
    });
}

/**
 * Sentencias del corpus que llevan demasiado sin verificarse.
 *
 * Se declara en el certificado. Una cita a una sentencia cuya vigencia nadie
 * comprobó hace meses es exactamente el riesgo que este proyecto ataca, así
 * que el sistema lo dice en vez de disimularlo.
 */
export function sentenciasVencidas(hoy: Date, diasMaximo = 30): string[] {
  return CORPUS.filter((s) => {
    const dias = (hoy.getTime() - new Date(`${s.verificadaEl}T00:00:00Z`).getTime()) / 86_400_000;
    return dias > diasMaximo;
  }).map((s) => s.id);
}
