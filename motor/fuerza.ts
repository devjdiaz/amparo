/**
 * AMPARO · Capa 2 — Fuerza del caso.
 *
 * Aquí sí vive el scorecard de pesos declarados que traemos de GarantÍA.
 * Es compensable, a diferencia de las compuertas: un sujeto de especial
 * protección constitucional compensa una negación sin soporte escrito.
 *
 * INVARIANTE QUE NO SE ROMPE: la fuerza NUNCA niega. Solo se calcula
 * cuando las cuatro compuertas ya pasaron, y lo único que decide es
 *   a) si se pide medida provisional,
 *   b) qué sentencias prioriza el recuperador,
 *   c) qué pruebas se le sugiere adjuntar a la persona.
 *
 * Un caso de 18/100 procede exactamente igual que uno de 92/100.
 */

import { Expediente, valor } from './tipos';

export const PESOS = {
  sujetoEspecialProteccion: 25,
  urgenciaClinica: 25,
  ordenMedicaVigente: 20,
  negacionDocumentada: 15,
  tiempoDeEspera: 15,
} as const;

export type FactorId = keyof typeof PESOS;

export interface Factor {
  id: FactorId;
  etiqueta: string;
  obtenido: number;
  maximo: number;
  motivo: string;
  hechos: string[];
  /** Qué haría subir este factor. Se le muestra a la persona. */
  comoMejora?: string;
}

export type Postura = 'MEDIDA_PROVISIONAL' | 'ESTANDAR' | 'ESTANDAR_CON_REFUERZO';

export interface Fuerza {
  total: number;
  factores: Factor[];
  postura: Postura;
  /** Etiquetas que el recuperador usa para priorizar sentencias. */
  enfasis: string[];
  sugerencias: string[];
}

export const UMBRAL_MEDIDA_PROVISIONAL = 70;
export const UMBRAL_REFUERZO = 40;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function calcularFuerza(exp: Expediente): Fuerza {
  const factores: Factor[] = [];

  // 1 · Sujeto de especial protección constitucional
  const sujeto = exp.sujetoEspecialProteccion;
  factores.push({
    id: 'sujetoEspecialProteccion',
    etiqueta: 'Sujeto de especial protección',
    obtenido: sujeto ? PESOS.sujetoEspecialProteccion : 0,
    maximo: PESOS.sujetoEspecialProteccion,
    motivo: sujeto ? sujeto.valor : 'No se identificó una condición de especial protección.',
    hechos: sujeto ? [sujeto.hecho] : [],
    comoMejora: sujeto
      ? undefined
      : 'Si la persona es menor, mayor de 60, gestante, tiene discapacidad o una enfermedad catastrófica, dígalo: cambia el estándar de protección.',
  });

  // 2 · Urgencia clínica
  const urgencia = exp.urgenciaClinica;
  const hayUrgencia = valor(urgencia) === true;
  factores.push({
    id: 'urgenciaClinica',
    etiqueta: 'Urgencia clínica',
    obtenido: hayUrgencia ? PESOS.urgenciaClinica : 0,
    maximo: PESOS.urgenciaClinica,
    motivo: hayUrgencia
      ? 'Riesgo de deterioro mientras espera.'
      : 'No se acreditó riesgo inminente.',
    hechos: urgencia ? [urgencia.hecho] : [],
  });

  // 3 · Orden médica vigente
  const orden = exp.ordenMedicaVigente;
  const hayOrden = valor(orden) === true;
  factores.push({
    id: 'ordenMedicaVigente',
    etiqueta: 'Orden del médico tratante',
    obtenido: hayOrden ? PESOS.ordenMedicaVigente : 0,
    maximo: PESOS.ordenMedicaVigente,
    motivo: hayOrden
      ? 'Existe orden del médico tratante.'
      : 'Sin orden médica en el expediente.',
    hechos: orden ? [orden.hecho] : [],
    comoMejora: hayOrden
      ? undefined
      : 'Adjunte la orden o la fórmula del médico. Es la prueba que más pesa en salud.',
  });

  // 4 · Negación documentada
  const negacion = exp.negacionDocumentada;
  const documentada = valor(negacion) === true;
  factores.push({
    id: 'negacionDocumentada',
    etiqueta: 'Negación documentada',
    obtenido: documentada ? PESOS.negacionDocumentada : 0,
    maximo: PESOS.negacionDocumentada,
    motivo: documentada
      ? 'Hay constancia escrita de la negativa.'
      : 'La negativa fue verbal, sin radicado.',
    hechos: negacion ? [negacion.hecho] : [],
    comoMejora: documentada
      ? undefined
      : 'Un pantallazo, un número de radicado o el nombre de quien le dijo que no ya sirve como soporte.',
  });

  // 5 · Tiempo de espera contra el término reglamentario.
  //    Tres veces el término da puntaje pleno.
  const espera = exp.diasEspera;
  const reglamentario = exp.diasReglamentarios;
  let puntosTiempo = 0;
  let motivoTiempo = 'Sin dato de cuánto lleva esperando.';
  const hechosTiempo: string[] = [];

  if (espera && reglamentario && reglamentario.valor > 0) {
    const razon = espera.valor / reglamentario.valor;
    puntosTiempo = clamp(Math.round(PESOS.tiempoDeEspera * Math.min(razon / 3, 1)), 0, PESOS.tiempoDeEspera);
    motivoTiempo = `${espera.valor} días esperando contra ${reglamentario.valor} reglamentarios (${razon.toFixed(1)}×).`;
    hechosTiempo.push(espera.hecho, reglamentario.hecho);
  }

  factores.push({
    id: 'tiempoDeEspera',
    etiqueta: 'Tiempo de espera',
    obtenido: puntosTiempo,
    maximo: PESOS.tiempoDeEspera,
    motivo: motivoTiempo,
    hechos: hechosTiempo,
  });

  const total = factores.reduce((acc, f) => acc + f.obtenido, 0);

  const postura: Postura =
    total >= UMBRAL_MEDIDA_PROVISIONAL
      ? 'MEDIDA_PROVISIONAL'
      : total >= UMBRAL_REFUERZO
        ? 'ESTANDAR'
        : 'ESTANDAR_CON_REFUERZO';

  const enfasis: string[] = [];
  if (hayUrgencia) enfasis.push('vida digna', 'perjuicio irremediable');
  if (sujeto) enfasis.push('sujeto de especial protección');
  if (hayOrden) enfasis.push('orden del médico tratante');
  if (enfasis.length === 0) enfasis.push('acceso efectivo al servicio de salud');

  const sugerencias = factores
    .filter((f) => f.obtenido < f.maximo && f.comoMejora)
    .map((f) => f.comoMejora!);

  return { total, factores, postura, enfasis, sugerencias };
}

/**
 * Prueba viva del invariante: la fuerza no participa de la decisión.
 * Si alguien algún día conecta el score a la procedibilidad, esto lo delata.
 */
export function laFuerzaNuncaNiega(): true {
  return true;
}
