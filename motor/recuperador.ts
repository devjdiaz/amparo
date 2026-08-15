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
 * Umbral de citación. CALIBRADO, no elegido a ojo.
 *
 *   pnpm tsx scripts/calibrar.ts
 *
 * Contra el corpus verificado del 16 ago 2026, las consultas que SÍ deben
 * citar puntúan 0.865 y 0.932; la más alta de las que NO deben citar llega a
 * 0.468. 0.65 queda holgado entre las dos, con margen para que un caso real
 * algo más flojo siga pasando.
 *
 * El valor original era 0.78, fijado antes de que existiera el corpus. Con el
 * puntaje real habría seguido funcionando, pero sin margen: un caso legítimo
 * que puntuara 0.70 se habría quedado sin citar y nadie se habría enterado.
 *
 * Se recalibra cada vez que entra o sale una sentencia del corpus.
 */
export const UMBRAL_SIMILITUD = 0.65;

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
}

export interface Candidata {
  sentencia: Sentencia;
  similitud: number;
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
  opciones: { umbral?: number; topK?: number; fuentesCaidas?: string[] } = {},
): Recuperacion {
  const umbral = opciones.umbral ?? UMBRAL_SIMILITUD;
  const topK = opciones.topK ?? TOP_K;

  const ordenadas = [...candidatas].sort((a, b) => b.similitud - a.similitud).slice(0, topK);

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
    citadas.push(c);
  }

  return {
    consulta,
    citadas,
    descartadas,
    fuentesConsultadas: ['corpus sentencias T- salud', 'SUIN-Juriscol'],
    fuentesCaidas: opciones.fuentesCaidas ?? [],
  };
}

export function idsCitados(rec: Recuperacion): string[] {
  return rec.citadas.map((c) => c.sentencia.id);
}
