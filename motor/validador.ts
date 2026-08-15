/**
 * AMPARO · La aduana.
 *
 * El redactor devuelve texto con marcas [#h3]. Este módulo verifica, sin
 * modelo y sin red, que ese texto no diga nada que el sistema no pueda
 * respaldar. Convierte "no alucinamos" de promesa a prueba ejecutable.
 *
 * Tres reglas:
 *   1. Toda afirmación de hecho lleva al menos una marca.
 *   2. Toda marca existe en la memoria.
 *   3. Toda sentencia citada viene del recuperador. Si el recuperador
 *      devolvió cero, el texto debe tener cero sentencias.
 *
 * Si algo falla, el texto no se publica. No hay grado de confianza:
 * hay pasa o no pasa.
 */

import { Memoria } from './tipos';

const RE_MARCA = /\[#([a-zA-Z0-9_-]+)\]/g;
/** T-760/08 · T-121 /15 · T-1234/2019 */
const RE_SENTENCIA = /\bT-\s?\d{1,4}\s?\/\s?\d{2,4}\b/g;

export type TipoViolacion =
  | 'AFIRMACION_SIN_RESPALDO'
  | 'HECHO_INEXISTENTE'
  | 'CITA_NO_RECUPERADA';

export interface Violacion {
  tipo: TipoViolacion;
  fragmento: string;
  detalle: string;
}

export interface Validacion {
  ok: boolean;
  violaciones: Violacion[];
  afirmaciones: number;
  afirmacionesRespaldadas: number;
  sentenciasEnTexto: string[];
}

/** Corta en oraciones sin romperse con abreviaturas jurídicas comunes. */
export function partirEnAfirmaciones(texto: string): string[] {
  const protegido = texto
    .replace(/\bart\./gi, 'art\u0000')
    .replace(/\bnum\./gi, 'num\u0000')
    .replace(/\bEE\.\s?UU\./g, 'EE\u0000UU\u0000')
    .replace(/\bC\.P\./g, 'C\u0000P\u0000');

  return protegido
    .split(/(?<=[.:;])\s+|\n+/)
    .map((s) => s.replace(/\u0000/g, '.').trim())
    .filter((s) => s.length > 0);
}

function normalizarSentencia(s: string): string {
  return s.replace(/\s+/g, '').toUpperCase();
}

export interface OpcionesValidacion {
  /** Oraciones de fórmula que no afirman hechos: encabezado, petitorio, juramento. */
  formulasPermitidas?: RegExp[];
}

const FORMULAS_POR_DEFECTO: RegExp[] = [
  /^se[ñn]or[a]?\s+juez/i,
  /^respetuosamente/i,
  /^solicito/i,
  /^bajo la gravedad del juramento/i,
  /^manifiesto que no he presentado/i,
  /^atentamente/i,
  /^notificaciones/i,
  /^anexos?:/i,
];

export function validarRedaccion(
  texto: string,
  memoria: Memoria,
  sentenciasRecuperadas: string[],
  opciones: OpcionesValidacion = {},
): Validacion {
  const violaciones: Violacion[] = [];
  const formulas = [...FORMULAS_POR_DEFECTO, ...(opciones.formulasPermitidas ?? [])];

  const permitidas = new Set(sentenciasRecuperadas.map(normalizarSentencia));

  // Regla 3 — citas
  const enTexto = [...texto.matchAll(RE_SENTENCIA)].map((m) => m[0]);
  for (const cita of enTexto) {
    if (!permitidas.has(normalizarSentencia(cita))) {
      violaciones.push({
        tipo: 'CITA_NO_RECUPERADA',
        fragmento: cita,
        detalle:
          sentenciasRecuperadas.length === 0
            ? 'El recuperador no entregó ninguna sentencia y el texto cita una.'
            : `No está entre las que entregó el recuperador: ${sentenciasRecuperadas.join(', ')}.`,
      });
    }
  }

  // Reglas 1 y 2 — marcas
  const afirmaciones = partirEnAfirmaciones(texto);
  let respaldadas = 0;

  for (const af of afirmaciones) {
    if (formulas.some((f) => f.test(af))) {
      respaldadas += 1;
      continue;
    }

    const marcas = [...af.matchAll(RE_MARCA)].map((m) => m[1]);

    if (marcas.length === 0) {
      violaciones.push({
        tipo: 'AFIRMACION_SIN_RESPALDO',
        fragmento: af,
        detalle: 'No declara de qué hecho salió.',
      });
      continue;
    }

    const huerfanas = marcas.filter((id) => !memoria.tiene(id));
    if (huerfanas.length > 0) {
      violaciones.push({
        tipo: 'HECHO_INEXISTENTE',
        fragmento: af,
        detalle: `Cita hechos que no existen en la memoria: ${huerfanas.join(', ')}.`,
      });
      continue;
    }

    respaldadas += 1;
  }

  return {
    ok: violaciones.length === 0,
    violaciones,
    afirmaciones: afirmaciones.length,
    afirmacionesRespaldadas: respaldadas,
    sentenciasEnTexto: enTexto,
  };
}

/**
 * Política de reintento. Un intento de corrección devolviéndole al modelo
 * sus propias violaciones; si vuelve a fallar, se recorta la oración
 * ofensora y queda declarado en el certificado. Nunca pasa en silencio.
 */
export function recortarOfensoras(texto: string, validacion: Validacion): string {
  const fuera = new Set(
    validacion.violaciones
      .filter((v) => v.tipo !== 'CITA_NO_RECUPERADA')
      .map((v) => v.fragmento),
  );
  return partirEnAfirmaciones(texto)
    .filter((af) => !fuera.has(af))
    .join(' ');
}
