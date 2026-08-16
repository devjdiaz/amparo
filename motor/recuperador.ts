/**
 * AMPARO · Recuperación.
 *
 * Dos decisiones que hacen la diferencia:
 *
 * 1. La consulta NO es la transcripción. Se arma desde los campos ya
 *    estructurados del expediente, así que es determinista y reproducible:
 *    el mismo caso produce la misma consulta y el mismo corpus produce las
 *    mismas citas. Eso es lo que hace auditable al recuperador.
 *
 * 2. El umbral es duro y el resultado puede ser CERO. Preferimos entregar
 *    una tutela sin jurisprudencia y decirlo, que entregarla con una
 *    sentencia traída de los pelos. Cero citas es un resultado válido.
 */

import { Expediente, valor } from './tipos';
import { Fuerza } from './fuerza';

/**
 * Umbral de citación. CALIBRADO contra los expedientes reales, no a ojo.
 *
 *   pnpm tsx scripts/calibrar.ts
 *
 * Con el corpus verificado del 16 ago 2026 y las consultas que produce de
 * verdad construirConsulta():
 *
 *     lo más flojo que SÍ debe citar   0.592   (T-377/24, caso de la cita)
 *     lo más alto que NO debe citar    0.196
 *     margen a cada lado de 0.40       ±0.198
 *
 * Historia de este número, porque enseña algo:
 *
 *   0.78  fijado a ciegas, antes de que existiera el corpus. Habría citado
 *         cero en los dos casos que sí deben citar.
 *   0.65  calibrado contra consultas escritas A MANO, parecidas pero no
 *         iguales a las reales. Seguía citando cero: calibrar contra una
 *         consulta aproximada es no calibrar.
 *   0.40  calibrado contra construirConsulta() sobre los expedientes reales,
 *         y después de bajar el encuadre jurídico genérico de `etiquetas` a
 *         `tema`/`subregla` en el corpus. Eso último triplicó el margen.
 *
 * MEDICIÓN EN VIVO, que es la que manda:
 *
 * Los expedientes de referencia están escritos a mano y usan el vocabulario
 * "correcto". El extractor real, leyendo habla, produce consultas más flacas:
 * donde el fixture dice "cita con especialista en neurología", la extracción
 * de la misma grabación dijo "consulta con neurología". Los términos `cita` y
 * `especialista` —los más fuertes de T-377/24— desaparecían.
 *
 *     con el corpus original      T-377/24 = 0.434   (margen 0.03, muy justo)
 *     tras enriquecer etiquetas   T-377/24 = 0.490   (margen 0.09)
 *     lo más alto que no cita     T-252/24 = 0.334
 *
 * 0.40 queda casi exacto en el punto medio de los números EN VIVO. El arreglo
 * de fondo no fue mover el umbral: fue curar el corpus con el vocabulario que
 * cada sentencia usa de verdad — T-377/24 habla de "cita" Y de "consulta", y
 * solo teníamos una. El puntaje dependía de qué palabra le saliera al
 * extractor, que es una lotería que no queremos.
 *
 * Se recalibra cada vez que entra o sale una sentencia, o cambia un
 * expediente de referencia.
 */
export const UMBRAL_SIMILITUD = 0.4;

/**
 * Cuántas sentencias puede citar una tutela como máximo.
 *
 * Precisión antes que cobertura: una cita exacta con su enlace vale más que
 * tres traídas de los pelos, y las descartadas viajan igual en el certificado
 * con el motivo. Ver la regla de la casa en recuperador.filtrarCandidatas.
 */
export const TOP_K = 5;

export interface Sentencia {
  id: string;              // 'T-760/08'
  url: string;             // relatoría de la Corte, verificada
  tema: string;
  /** Subregla curada a mano. Es lo único que el redactor puede parafrasear. */
  subregla: string;
  verificadaEl: string;    // ISO. Si está vieja, se declara en el certificado.
  /**
   * Cita literal de la sentencia, comprobada contra la página de la relatoría.
   * Es lo que permite contrastar la subregla contra la fuente sin confiar en
   * nosotros, y es lo que va al certificado junto al enlace.
   */
  textual?: string;
  /** Curadas a mano. Alimentan el gate y el puntaje del recuperador. */
  etiquetas?: string[];
}

export interface Candidata {
  sentencia: Sentencia;
  similitud: number;
  /**
   * Por qué puntuó lo que puntuó, en una frase. Un puntaje sin razón no sirve
   * de nada en un certificado de auditoría.
   */
  explicacion?: string;
}

export interface Descartada {
  id: string;
  similitud: number;
  motivo: string;
}

export interface Recuperacion {
  consulta: string;
  citadas: Candidata[];
  descartadas: Descartada[];
  /** Cuántas se miraron en total. citadas + descartadas debe dar esto. */
  evaluadas: number;
  fuentesConsultadas: string[];
  fuentesCaidas: string[];
}

export function construirConsulta(exp: Expediente, fuerza: Fuerza): string {
  const partes = [
    valor(exp.servicio),
    valor(exp.tipoNegacion),
    valor(exp.sujetoEspecialProteccion),
    ...fuerza.enfasis,
  ].filter((p): p is string => typeof p === 'string' && p.trim() !== '');

  return partes.join(' · ');
}

export function filtrarCandidatas(
  consulta: string,
  candidatas: Candidata[],
  opciones: {
    umbral?: number;
    topK?: number;
    fuentesConsultadas?: string[];
    fuentesCaidas?: string[];
  } = {},
): Recuperacion {
  const umbral = opciones.umbral ?? UMBRAL_SIMILITUD;
  const topK = opciones.topK ?? TOP_K;

  // Se ordena y se recorre ENTERO. El corte por topK se aplica a las citas,
  // nunca a la evaluación: una candidata que se miró y no se citó tiene que
  // aparecer en el certificado con su motivo. Si se cortara antes de filtrar,
  // las peor puntuadas desaparecerían sin dejar rastro y el certificado
  // estaría diciendo que se evaluaron menos de las que se evaluaron.
  const ordenadas = [...candidatas].sort((a, b) => b.similitud - a.similitud);

  const citadas: Candidata[] = [];
  const descartadas: Descartada[] = [];

  for (const c of ordenadas) {
    if (c.similitud < umbral) {
      descartadas.push({
        id: c.sentencia.id,
        similitud: c.similitud,
        motivo: `similitud ${c.similitud.toFixed(2)} bajo el umbral ${umbral}`,
      });
      continue;
    }
    if (!c.sentencia.url || !/^https?:\/\//.test(c.sentencia.url)) {
      descartadas.push({
        id: c.sentencia.id,
        similitud: c.similitud,
        motivo: 'sin enlace verificable a la relatoría',
      });
      continue;
    }
    if (citadas.length >= topK) {
      descartadas.push({
        id: c.sentencia.id,
        similitud: c.similitud,
        motivo: `supera el umbral, pero ya hay ${topK} sentencias mejor puntuadas`,
      });
      continue;
    }
    citadas.push(c);
  }

  return {
    consulta,
    citadas,
    descartadas,
    evaluadas: candidatas.length,
    fuentesConsultadas: opciones.fuentesConsultadas ?? ['corpus de sentencias T- de salud'],
    fuentesCaidas: opciones.fuentesCaidas ?? [],
  };
}

export function idsCitados(rec: Recuperacion): string[] {
  return rec.citadas.map((c) => c.sentencia.id);
}
