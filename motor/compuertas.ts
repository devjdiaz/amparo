/**
 * AMPARO · Capa 1 — Compuertas de procedibilidad.
 *
 * CONJUNTIVAS, no compensables. Aquí NO hay pesos ni sumas: los cuatro
 * requisitos de la tutela son condiciones legales independientes y una
 * legitimación impecable no salva una subsidiariedad fallida.
 *
 * Se evalúan las cuatro SIEMPRE, sin corto circuito. Salir en la primera
 * falla daría un "no" con una sola razón, y la regla de la casa es que
 * un no nunca se entrega solo.
 *
 * Sin LLM. Determinista. Misma entrada, misma salida, para siempre.
 */

import { Expediente, ids, Quizas, valor } from './tipos';

export type Veredicto = 'PASA' | 'FALLA' | 'INDETERMINADO';

export interface RutaAlterna {
  accion: string;      // qué puede hacer hoy
  comoSeHace: string;  // en lenguaje llano, trato de usted
  plazo?: string;      // cuándo volver
  generable: boolean;  // si AMPARO puede redactarlo ahora mismo
}

/** Qué tipo de control usar para capturar la respuesta de seguimiento. */
export type TipoCampoPreguntable = 'booleano' | 'fecha';

export interface ResultadoCompuerta {
  regla: 'legitimacion' | 'inmediatez' | 'subsidiariedad' | 'no_temeridad';
  veredicto: Veredicto;
  /** Va a pantalla. Lenguaje llano, sin jerga. */
  motivo: string;
  /** Va al documento. Aquí sí vive la jerga jurídica. */
  fundamento: string;
  /** Ids de los hechos que sustentan este veredicto. */
  hechos: string[];
  excepcion?: string;
  /** Solo si INDETERMINADO. Es la pregunta exacta que hay que hacerle. */
  pregunta?: string;
  /** Solo si INDETERMINADO. El campo exacto del Expediente que falta. */
  campo?: keyof Expediente;
  /** Solo si INDETERMINADO. Qué control mostrar para responder. */
  tipoCampo?: TipoCampoPreguntable;
  /** Solo si FALLA. Nunca un no seco. */
  ruta?: RutaAlterna;
}

/** Referencia jurisprudencial de la Corte, no término legal fijo. */
export const DIAS_INMEDIATEZ = 180;

const DIA_MS = 86_400_000;

export function diasEntre(desdeISO: string, hasta: Date): number {
  const desde = new Date(`${desdeISO}T00:00:00Z`);
  const ref = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), hasta.getUTCDate()));
  return Math.floor((ref.getTime() - desde.getTime()) / DIA_MS);
}

function indeterminado(
  regla: ResultadoCompuerta['regla'],
  pregunta: string,
  fundamento: string,
  campo: keyof Expediente,
  tipoCampo: TipoCampoPreguntable,
): ResultadoCompuerta {
  return {
    regla,
    veredicto: 'INDETERMINADO',
    motivo: 'Falta un dato para poder responder esto.',
    fundamento,
    hechos: [],
    pregunta,
    campo,
    tipoCampo,
  };
}

// ─────────────────────────────────────────────────────────────
// 1 · Legitimación en la causa por activa
// ─────────────────────────────────────────────────────────────

export function legitimacion(exp: Expediente): ResultadoCompuerta {
  const FUND = 'Art. 86 C.P. · arts. 10 y 46 Decreto 2591 de 1991';
  const titular = valor(exp.solicitanteEsTitular);

  if (titular === null) {
    return indeterminado(
      'legitimacion',
      '¿La persona afectada es la misma que va a firmar la tutela?',
      FUND,
      'solicitanteEsTitular',
      'booleano',
    );
  }

  if (titular === true) {
    return {
      regla: 'legitimacion',
      veredicto: 'PASA',
      motivo: 'La tutela la presenta la persona afectada.',
      fundamento: FUND,
      hechos: ids(exp.solicitanteEsTitular),
    };
  }

  const puedeSolo = valor(exp.titularPuedeActuarPorSiMismo);
  if (puedeSolo === null) {
    return indeterminado(
      'legitimacion',
      '¿La persona afectada está en condiciones de presentar la tutela por sí misma?',
      FUND,
      'titularPuedeActuarPorSiMismo',
      'booleano',
    );
  }

  if (puedeSolo === false) {
    return {
      regla: 'legitimacion',
      veredicto: 'PASA',
      motivo: 'Usted la presenta a nombre de la persona afectada, que no puede hacerlo sola.',
      fundamento: FUND,
      hechos: ids(exp.solicitanteEsTitular, exp.titularPuedeActuarPorSiMismo),
      excepcion:
        'Agencia oficiosa. Debe manifestarse expresamente en el escrito que el titular no está en condiciones de promover su propia defensa.',
    };
  }

  return {
    regla: 'legitimacion',
    veredicto: 'FALLA',
    motivo: 'La tutela la tiene que firmar la persona afectada, no un tercero.',
    fundamento: FUND,
    hechos: ids(exp.solicitanteEsTitular, exp.titularPuedeActuarPorSiMismo),
    ruta: {
      accion: 'Que la firme la persona afectada',
      comoSeHace:
        'El escrito sale igual. Solo cambia quién lo firma y quién lo radica. También sirve un poder si usted prefiere hacer el trámite.',
      // Reutilizaría la misma redacción de la tutela, pero esa solo se
      // genera cuando la salida es PROCEDE — acá nunca corrió. No hay texto
      // que ofrecer todavía, así que no se promete un botón que no hace nada.
      generable: false,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 2 · Inmediatez
// ─────────────────────────────────────────────────────────────

export function inmediatez(exp: Expediente, hoy: Date): ResultadoCompuerta {
  const FUND = 'Art. 86 C.P. — inmediatez como requisito de procedibilidad';
  const fecha = valor(exp.fechaVulneracion);

  if (fecha === null) {
    return indeterminado(
      'inmediatez',
      '¿Cuándo fue que le negaron el servicio?',
      FUND,
      'fechaVulneracion',
      'fecha',
    );
  }

  const dias = diasEntre(fecha, hoy);

  if (dias < 0) {
    return {
      regla: 'inmediatez',
      veredicto: 'INDETERMINADO',
      motivo: 'La fecha que tenemos está en el futuro. Hay que corregirla.',
      fundamento: FUND,
      hechos: ids(exp.fechaVulneracion),
      pregunta: '¿Me confirma la fecha en que le negaron el servicio?',
      campo: 'fechaVulneracion',
      tipoCampo: 'fecha',
    };
  }

  if (dias <= DIAS_INMEDIATEZ) {
    return {
      regla: 'inmediatez',
      veredicto: 'PASA',
      motivo: `Pasaron ${dias} días desde la negación. Está dentro de término.`,
      fundamento: FUND,
      hechos: ids(exp.fechaVulneracion),
    };
  }

  const continua = valor(exp.vulneracionContinua);
  if (continua === null) {
    return indeterminado(
      'inmediatez',
      '¿Le siguen negando el servicio hoy?',
      FUND,
      'vulneracionContinua',
      'booleano',
    );
  }

  if (continua === true) {
    return {
      regla: 'inmediatez',
      veredicto: 'PASA',
      motivo: `Pasaron ${dias} días, pero el servicio le sigue sin prestarse.`,
      fundamento: FUND,
      hechos: ids(exp.fechaVulneracion, exp.vulneracionContinua),
      excepcion:
        'Vulneración continuada: el término de inmediatez no corre mientras la afectación persiste.',
    };
  }

  return {
    regla: 'inmediatez',
    veredicto: 'FALLA',
    motivo: `Pasaron ${dias} días y el asunto ya se resolvió. El juez va a decir que se demoró mucho.`,
    fundamento: FUND,
    hechos: ids(exp.fechaVulneracion, exp.vulneracionContinua),
    ruta: {
      accion: 'Queja ante la Superintendencia Nacional de Salud',
      comoSeHace:
        'La queja no tiene término de caducidad y sirve para que quede el antecedente contra la EPS.',
      // Ruta real, pero AMPARO todavía no redacta este documento — a
      // diferencia del derecho de petición, que sí. Declarar la diferencia
      // en vez de mostrar un botón que no hace nada.
      generable: false,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 3 · Subsidiariedad
// ─────────────────────────────────────────────────────────────

export function subsidiariedad(exp: Expediente): ResultadoCompuerta {
  const FUND = 'Art. 86 C.P. · art. 6 num. 1 Decreto 2591 de 1991';
  const urgencia = valor(exp.urgenciaClinica);

  if (urgencia === true) {
    return {
      regla: 'subsidiariedad',
      veredicto: 'PASA',
      motivo: 'Hay riesgo para su salud. Esperar otro trámite no es una opción razonable.',
      fundamento: FUND,
      hechos: ids(exp.urgenciaClinica),
      excepcion:
        'Perjuicio irremediable: el medio ordinario no resulta idóneo ni eficaz frente a la urgencia acreditada.',
    };
  }

  if (urgencia === null) {
    return indeterminado(
      'subsidiariedad',
      '¿Su salud se está deteriorando o tiene dolor mientras espera?',
      FUND,
      'urgenciaClinica',
      'booleano',
    );
  }

  const pidio = valor(exp.solicitudFormalPrevia);
  if (pidio === null) {
    return indeterminado(
      'subsidiariedad',
      '¿Ya pidió el servicio por escrito a la EPS y le respondieron?',
      FUND,
      'solicitudFormalPrevia',
      'booleano',
    );
  }

  if (pidio === false) {
    return {
      regla: 'subsidiariedad',
      veredicto: 'FALLA',
      motivo:
        'Todavía no ha pedido el servicio formalmente a la EPS, y el juez le va a decir que use primero ese camino.',
      fundamento: FUND,
      hechos: ids(exp.urgenciaClinica, exp.solicitudFormalPrevia),
      ruta: {
        accion: 'Derecho de petición a la EPS',
        comoSeHace: 'Se lo redacto ahora y usted lo radica. Tienen 15 días hábiles para responder.',
        plazo: 'Si en 15 días no le responden, vuelva. Ahí sí procede la tutela.',
        generable: true,
      },
    };
  }

  return {
    regla: 'subsidiariedad',
    veredicto: 'PASA',
    motivo: 'Usted ya pidió el servicio a la EPS y no se lo dieron.',
    fundamento: FUND,
    hechos: ids(exp.urgenciaClinica, exp.solicitudFormalPrevia),
  };
}

// ─────────────────────────────────────────────────────────────
// 4 · No temeridad
// ─────────────────────────────────────────────────────────────

export function noTemeridad(exp: Expediente): ResultadoCompuerta {
  const FUND = 'Art. 38 Decreto 2591 de 1991';
  const previa = valor(exp.tutelaPreviaMismosHechos);

  // Nunca se asume que no. La temeridad acarrea sanción.
  if (previa === null) {
    return indeterminado(
      'no_temeridad',
      '¿Ya había puesto una tutela antes por este mismo problema?',
      FUND,
      'tutelaPreviaMismosHechos',
      'booleano',
    );
  }

  if (previa === false) {
    return {
      regla: 'no_temeridad',
      veredicto: 'PASA',
      motivo: 'Es la primera tutela por estos hechos.',
      fundamento: FUND,
      hechos: ids(exp.tutelaPreviaMismosHechos),
    };
  }

  const nuevos = valor(exp.hechosNuevos);
  if (nuevos === null) {
    return indeterminado(
      'no_temeridad',
      '¿Pasó algo nuevo después de esa primera tutela?',
      FUND,
      'hechosNuevos',
      'booleano',
    );
  }

  if (nuevos === true) {
    return {
      regla: 'no_temeridad',
      veredicto: 'PASA',
      motivo: 'Hubo una tutela antes, pero pasaron cosas nuevas después.',
      fundamento: FUND,
      hechos: ids(exp.tutelaPreviaMismosHechos, exp.hechosNuevos),
      excepcion: 'Hechos nuevos y distintos. No configura temeridad.',
    };
  }

  return {
    regla: 'no_temeridad',
    veredicto: 'FALLA',
    motivo:
      'Ya hay una tutela por estos mismos hechos. Poner otra igual puede acarrearle una sanción.',
    fundamento: FUND,
    hechos: ids(exp.tutelaPreviaMismosHechos, exp.hechosNuevos),
    ruta: {
      accion: 'Incidente de desacato sobre el fallo que ya tiene',
      comoSeHace:
        'Si ganó y no le han cumplido, el camino es que el mismo juez haga cumplir su fallo, no una tutela nueva.',
      generable: false,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Evaluación conjunta
// ─────────────────────────────────────────────────────────────

export type Salida = 'PROCEDE' | 'NO_PROCEDE' | 'FALTAN_DATOS';

/** Una pregunta pendiente, con el campo exacto del Expediente que responde. */
export interface PreguntaPendiente {
  regla: ResultadoCompuerta['regla'];
  campo: keyof Expediente;
  tipoCampo: TipoCampoPreguntable;
  pregunta: string;
}

export interface Procedibilidad {
  salida: Salida;
  compuertas: ResultadoCompuerta[];
  /** Solo en NO_PROCEDE. */
  rutas: RutaAlterna[];
  /** Solo en FALTAN_DATOS. Se mantiene por compatibilidad con lo que ya la consume. */
  preguntas: string[];
  /** Solo en FALTAN_DATOS. La versión estructurada y auditable de `preguntas`. */
  preguntasDetalle: PreguntaPendiente[];
}

export function evaluarProcedibilidad(exp: Expediente, hoy = new Date()): Procedibilidad {
  // Las cuatro, siempre. Sin corto circuito: un no lleva todas sus razones.
  const compuertas = [
    legitimacion(exp),
    inmediatez(exp, hoy),
    subsidiariedad(exp),
    noTemeridad(exp),
  ];

  const fallas = compuertas.filter((c) => c.veredicto === 'FALLA');
  const dudas = compuertas.filter((c) => c.veredicto === 'INDETERMINADO');

  // Una falla dura gana sobre un dato faltante: si ya sabemos que no procede,
  // seguir preguntando le hace perder el tiempo a la persona. Se enruta ya.
  if (fallas.length > 0) {
    return {
      salida: 'NO_PROCEDE',
      compuertas,
      rutas: fallas.map((f) => f.ruta!).filter(Boolean),
      preguntas: [],
      preguntasDetalle: [],
    };
  }

  if (dudas.length > 0) {
    return {
      salida: 'FALTAN_DATOS',
      compuertas,
      rutas: [],
      preguntas: dudas.map((d) => d.pregunta!),
      preguntasDetalle: dudas.map((d) => ({
        regla: d.regla,
        campo: d.campo!,
        tipoCampo: d.tipoCampo!,
        pregunta: d.pregunta!,
      })),
    };
  }

  return { salida: 'PROCEDE', compuertas, rutas: [], preguntas: [], preguntasDetalle: [] };
}
