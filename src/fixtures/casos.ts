/**
 * Los tres casos de referencia.
 *
 * No son datos de prueba a los que después se les escribió un guion: son el
 * guion, escrito primero, y convertidos en expediente. Cada uno prueba un
 * camino distinto del sistema y corresponde a un momento del video:
 *
 *   1. cita-especialista  PROCEDE      → "así se ve cuando sí"
 *   2. medicamento        PROCEDE      → el segundo camino, otra jurisprudencia
 *   3. improcedente       NO_PROCEDE   → "acá el sistema se niega y enruta"
 *   4. faltan-datos       FALTAN_DATOS → "acá ni siquiera decide: pregunta"
 *
 * El cuarto no estaba en el alcance original. Se agrega porque `compuertas.ts`
 * ya devuelve INDETERMINADO con su pregunta y no se estaba usando: dos
 * resultados son un clasificador, tres son un sistema que alguien pondría en
 * producción.
 *
 * La transcripción de cada uno está escrita como habla la gente, con
 * muletillas y sin orden. Es lo que el extractor tiene que saber leer.
 */

import { campo, expedienteVacio, Memoria, type Expediente, type Hecho } from '../../motor/tipos';

export interface CasoReferencia {
  id: string;
  titulo: string;
  /** Lo que se espera. Es la aserción del guion, no una etiqueta decorativa. */
  esperado: 'PROCEDE' | 'NO_PROCEDE' | 'FALTAN_DATOS';
  transcripcion: string;
  memoria: Memoria;
  expediente: Expediente;
  hechos: Hecho[];
}

/** Arma memoria y lista de hechos de una vez, para no repetirlo cuatro veces. */
function construir(
  pares: [id: string, contenido: string, ref: string][],
): { memoria: Memoria; hechos: Hecho[] } {
  const memoria = new Memoria();
  const hechos: Hecho[] = [];
  for (const [id, contenido, ref] of pares) {
    hechos.push(memoria.agregar({ id, contenido, origen: { tipo: 'audio', ref } }));
  }
  return { memoria, hechos };
}

// ───────────────────────────────────────────────────────────────────────────
// 1 · Negación de cita con especialista → PROCEDE
// ───────────────────────────────────────────────────────────────────────────

const uno = construir([
  ['h1', 'la tutela es para ella misma, tiene 71 años', 'audio:00:04'],
  ['h2', 'le negaron la cita con neurología el 12 de julio de 2026', 'audio:00:11'],
  ['h3', 'sigue sin la cita al día de hoy', 'audio:00:19'],
  ['h4', 'tiene dolor y se le dificulta caminar mientras espera', 'audio:00:24'],
  ['h5', 'ya la pidió tres veces en la EPS y quedó constancia verbal', 'audio:00:31'],
  ['h6', 'el médico tratante ordenó la cita con neurología', 'audio:00:37'],
  ['h7', 'nunca ha presentado una tutela por estos hechos', 'audio:00:44'],
  ['h8', '34 días transcurridos desde la negación', 'audio:00:11'],
  ['h9', 'el término reglamentario para asignar la cita es de 5 días', 'norma:res-1552-2013'],
]);

export const CITA_ESPECIALISTA: CasoReferencia = {
  id: 'cita-especialista',
  titulo: 'Negación de cita con especialista',
  esperado: 'PROCEDE',
  transcripcion:
    'Buenas... eh, es que yo fui al médico y me dijo que necesitaba ver un neurólogo urgente, ' +
    'me dio la orden y todo, pero cuando fui a la EPS me dijeron que no, que eso no estaba ' +
    'autorizado, y eso fue el doce de julio. Ya he ido tres veces y nada. Yo tengo setenta y ' +
    'un años y me duele mucho, casi no puedo caminar bien. Nunca he puesto una tutela ni nada de eso.',
  memoria: uno.memoria,
  hechos: uno.hechos,
  expediente: {
    ...expedienteVacio,
    solicitanteEsTitular: campo(uno.memoria, true, 'h1'),
    fechaVulneracion: campo(uno.memoria, '2026-07-12', 'h2'),
    vulneracionContinua: campo(uno.memoria, true, 'h3'),
    urgenciaClinica: campo(uno.memoria, true, 'h4'),
    solicitudFormalPrevia: campo(uno.memoria, true, 'h5'),
    tutelaPreviaMismosHechos: campo(uno.memoria, false, 'h7'),
    sujetoEspecialProteccion: campo(uno.memoria, 'adulto mayor, 71 años', 'h1'),
    ordenMedicaVigente: campo(uno.memoria, true, 'h6'),
    negacionDocumentada: campo(uno.memoria, false, 'h5'),
    diasEspera: campo(uno.memoria, 34, 'h8'),
    diasReglamentarios: campo(uno.memoria, 5, 'h9'),
    servicio: campo(uno.memoria, 'cita con especialista en neurología', 'h6'),
    tipoNegacion: campo(uno.memoria, 'no asignación de cita', 'h2'),
    entidad: campo(uno.memoria, 'EPS', 'h2'),
  },
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · No entrega de medicamento oncológico → PROCEDE
// ───────────────────────────────────────────────────────────────────────────

const dos = construir([
  ['h1', 'la tutela es para ella misma', 'audio:00:03'],
  ['h2', 'le dejaron de entregar el medicamento el 2 de marzo de 2026', 'audio:00:10'],
  ['h3', 'sigue sin recibirlo', 'audio:00:16'],
  ['h4', 'tiene cáncer de mama y el tratamiento se interrumpió', 'audio:00:21'],
  ['h5', 'ya lo reclamó por escrito en la EPS', 'audio:00:28'],
  ['h6', 'el oncólogo tratante lo formuló', 'audio:00:34'],
  ['h7', 'tiene el radicado de la negativa', 'audio:00:40'],
  ['h8', 'no ha presentado tutela por estos hechos', 'audio:00:46'],
  ['h9', '166 días sin el medicamento', 'audio:00:10'],
  ['h10', 'el término reglamentario de entrega es de 2 días', 'norma:res-1552-2013'],
]);

export const MEDICAMENTO: CasoReferencia = {
  id: 'medicamento',
  titulo: 'No entrega de medicamento oncológico',
  esperado: 'PROCEDE',
  transcripcion:
    'Es que a mí me formularon un medicamento para el cáncer, el oncólogo, y desde marzo no me ' +
    'lo entregan. Yo ya reclamé por escrito, tengo el papel del radicado y todo, y nada. El ' +
    'tratamiento se me cortó. No he puesto tutela antes.',
  memoria: dos.memoria,
  hechos: dos.hechos,
  expediente: {
    ...expedienteVacio,
    solicitanteEsTitular: campo(dos.memoria, true, 'h1'),
    fechaVulneracion: campo(dos.memoria, '2026-03-02', 'h2'),
    vulneracionContinua: campo(dos.memoria, true, 'h3'),
    urgenciaClinica: campo(dos.memoria, true, 'h4'),
    solicitudFormalPrevia: campo(dos.memoria, true, 'h5'),
    tutelaPreviaMismosHechos: campo(dos.memoria, false, 'h8'),
    sujetoEspecialProteccion: campo(dos.memoria, 'enfermedad catastrófica: cáncer', 'h4'),
    ordenMedicaVigente: campo(dos.memoria, true, 'h6'),
    negacionDocumentada: campo(dos.memoria, true, 'h7'),
    diasEspera: campo(dos.memoria, 166, 'h9'),
    diasReglamentarios: campo(dos.memoria, 2, 'h10'),
    servicio: campo(dos.memoria, 'entrega de medicamento oncológico', 'h6'),
    tipoNegacion: campo(dos.memoria, 'no entrega', 'h2'),
    entidad: campo(dos.memoria, 'EPS', 'h2'),
  },
};

// ───────────────────────────────────────────────────────────────────────────
// 3 · Improcedente por subsidiariedad → NO_PROCEDE + ruta alterna
// ───────────────────────────────────────────────────────────────────────────

const tres = construir([
  ['h1', 'la tutela es para él mismo', 'audio:00:03'],
  ['h2', 'le dijeron que no hace dos semanas, en la ventanilla', 'audio:00:09'],
  ['h3', 'nunca lo ha pedido por escrito a la EPS', 'audio:00:17'],
  ['h4', 'no tiene dolor, es una cita de control', 'audio:00:23'],
  ['h5', 'no ha presentado tutelas por estos hechos', 'audio:00:29'],
]);

export const IMPROCEDENTE: CasoReferencia = {
  id: 'improcedente',
  titulo: 'Cita de control sin solicitud formal previa',
  esperado: 'NO_PROCEDE',
  transcripcion:
    'Yo necesito una cita de control con el médico general, fui a la EPS hace como dos semanas ' +
    'y en la ventanilla me dijeron que no había agenda. No, por escrito no he pedido nada. No, ' +
    'no me duele nada, es de control no más.',
  memoria: tres.memoria,
  hechos: tres.hechos,
  expediente: {
    ...expedienteVacio,
    solicitanteEsTitular: campo(tres.memoria, true, 'h1'),
    fechaVulneracion: campo(tres.memoria, '2026-08-01', 'h2'),
    urgenciaClinica: campo(tres.memoria, false, 'h4'),
    solicitudFormalPrevia: campo(tres.memoria, false, 'h3'),
    tutelaPreviaMismosHechos: campo(tres.memoria, false, 'h5'),
    servicio: campo(tres.memoria, 'cita de control con medicina general', 'h4'),
    tipoNegacion: campo(tres.memoria, 'no asignación de cita', 'h2'),
    entidad: campo(tres.memoria, 'EPS', 'h2'),
  },
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · Faltan datos → el sistema pregunta en vez de adivinar
// ───────────────────────────────────────────────────────────────────────────

const cuatro = construir([
  ['h1', 'la tutela es para su mamá', 'audio:00:05'],
  ['h2', 'le negaron un procedimiento ya autorizado', 'audio:00:13'],
  ['h3', 'no dijo la fecha de la negación', 'audio:00:13'],
]);

export const FALTAN_DATOS: CasoReferencia = {
  id: 'faltan-datos',
  titulo: 'Agencia oficiosa sin fecha de vulneración',
  esperado: 'FALTAN_DATOS',
  transcripcion:
    'Es para mi mamá. A ella le habían autorizado un procedimiento y después le dijeron que no, ' +
    'que ya no se lo iban a hacer. Ella no puede venir, está muy mal.',
  memoria: cuatro.memoria,
  hechos: cuatro.hechos,
  expediente: {
    ...expedienteVacio,
    solicitanteEsTitular: campo(cuatro.memoria, false, 'h1'),
    // No se sabe si la mamá puede actuar por sí misma, ni cuándo fue la
    // negación. El sistema NO asume: pregunta.
    servicio: campo(cuatro.memoria, 'procedimiento previamente autorizado', 'h2'),
    tipoNegacion: campo(cuatro.memoria, 'revocación de autorización', 'h2'),
  },
};

export const CASOS: CasoReferencia[] = [
  CITA_ESPECIALISTA,
  MEDICAMENTO,
  IMPROCEDENTE,
  FALTAN_DATOS,
];

export function casoPorId(id: string): CasoReferencia | undefined {
  return CASOS.find((c) => c.id === id);
}
