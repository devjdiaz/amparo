/**
 * AMPARO · Todos los números del motor, en un solo lugar y con su fundamento.
 *
 * Ninguna regla de negocio vive fuera de acá. Dos razones:
 *
 *   1. Cuando alguien pregunta "¿de dónde salió ese 180?", se abre un archivo
 *      y ahí está, con la norma o la línea jurisprudencial que lo sostiene. Un
 *      umbral sin fundamento es una opinión disfrazada de código.
 *   2. `hashDeReglas()` convierte este objeto en la huella que viaja al
 *      certificado. Dos decisiones tomadas con reglas distintas no se pueden
 *      confundir, y una decisión vieja se puede auditar contra las reglas que
 *      de verdad corrían ese día.
 *
 * Se muestra en pantalla. Un scorecard de pesos declarados se puede discutir;
 * un modelo entrenado no.
 */

import { DIAS_INMEDIATEZ } from '../../motor/compuertas';
import { PESOS, UMBRAL_MEDIDA_PROVISIONAL, UMBRAL_REFUERZO } from '../../motor/fuerza';
import { TOP_K, UMBRAL_SIMILITUD } from '../../motor/recuperador';
import { MOTOR_VERSION } from '../../motor/certificado';

export interface ReglaDeclarada {
  valor: number;
  etiqueta: string;
  /** De dónde sale. Norma, jurisprudencia, o decisión de producto declarada. */
  fundamento: string;
}

export const REGLAS_DECLARADAS = {
  motorVersion: MOTOR_VERSION,

  procedibilidad: {
    diasInmediatez: {
      valor: DIAS_INMEDIATEZ,
      etiqueta: 'Días de referencia para la inmediatez',
      fundamento:
        'Art. 86 C.P. No es un término legal fijo: la Corte no fijó plazo. Seis meses es la referencia jurisprudencial más usada, y la vulneración continuada la excepciona.',
    } satisfies ReglaDeclarada,
  },

  /**
   * Pesos de la fuerza del caso. NO deciden procedibilidad — solo si se pide
   * medida provisional, qué se prioriza al citar y qué pruebas se sugieren.
   */
  fuerza: {
    sujetoEspecialProteccion: {
      valor: PESOS.sujetoEspecialProteccion,
      etiqueta: 'Sujeto de especial protección',
      fundamento:
        'Menores, adultos mayores, gestantes, personas con discapacidad y enfermedad catastrófica tienen estándar reforzado. T-252/24 lo aplica expresamente.',
    } satisfies ReglaDeclarada,
    urgenciaClinica: {
      valor: PESOS.urgenciaClinica,
      etiqueta: 'Urgencia clínica',
      fundamento:
        'Art. 6 num. 1 Decreto 2591/91: el perjuicio irremediable habilita la tutela aunque exista otro medio.',
    } satisfies ReglaDeclarada,
    ordenMedicaVigente: {
      valor: PESOS.ordenMedicaVigente,
      etiqueta: 'Orden del médico tratante',
      fundamento:
        'Art. 17 Ley 1751/15 (autonomía médica). T-268/23: existiendo prescripción, el servicio se ordena directamente.',
    } satisfies ReglaDeclarada,
    negacionDocumentada: {
      valor: PESOS.negacionDocumentada,
      etiqueta: 'Negación documentada',
      fundamento:
        'Decisión de producto: una negativa con radicado es más fácil de probar que una verbal. No es requisito legal.',
    } satisfies ReglaDeclarada,
    tiempoDeEspera: {
      valor: PESOS.tiempoDeEspera,
      etiqueta: 'Tiempo de espera sobre el término reglamentario',
      fundamento:
        'T-377/24: solo razones estrictamente médicas justifican un retraso. Puntaje pleno a las tres veces el término.',
    } satisfies ReglaDeclarada,
  },

  umbrales: {
    medidaProvisional: {
      valor: UMBRAL_MEDIDA_PROVISIONAL,
      etiqueta: 'Fuerza mínima para pedir medida provisional',
      fundamento:
        'Art. 7 Decreto 2591/91. Decisión de producto: por debajo de este puntaje no se pide, para no desgastar la figura.',
    } satisfies ReglaDeclarada,
    refuerzo: {
      valor: UMBRAL_REFUERZO,
      etiqueta: 'Fuerza por debajo de la cual se sugiere reforzar pruebas',
      fundamento: 'Decisión de producto. No afecta la procedibilidad.',
    } satisfies ReglaDeclarada,
    similitud: {
      valor: UMBRAL_SIMILITUD,
      etiqueta: 'Similitud mínima para citar una sentencia',
      fundamento:
        'Calibrado contra el corpus verificado (scripts/calibrar.ts): lo que debe citar puntúa 0.865–0.932; lo máximo que no debe citar llega a 0.468.',
    } satisfies ReglaDeclarada,
    maximoCitas: {
      valor: TOP_K,
      etiqueta: 'Máximo de sentencias citadas',
      fundamento:
        'Decisión de producto: precisión antes que cobertura. Las que superan el umbral pero quedan fuera se declaran en el certificado.',
    } satisfies ReglaDeclarada,
  },
} as const;

/** Aplanado para pintar la tabla de pesos en pantalla. */
export function reglasEnLista(): (ReglaDeclarada & { grupo: string })[] {
  const salida: (ReglaDeclarada & { grupo: string })[] = [];
  for (const [grupo, contenido] of Object.entries(REGLAS_DECLARADAS)) {
    if (typeof contenido !== 'object' || contenido === null) continue;
    for (const regla of Object.values(contenido)) {
      if (regla && typeof regla === 'object' && 'fundamento' in regla) {
        salida.push({ ...(regla as ReglaDeclarada), grupo });
      }
    }
  }
  return salida;
}
