/**
 * AMPARO · Recuperación determinística y explicable.
 *
 * Esta es la pieza que decide qué sentencias compiten por ser citadas, así
 * que tiene que poder mirarse a los ojos. Un embedding daría un número que
 * nadie puede discutir; acá el puntaje se descompone en las coincidencias
 * concretas que lo produjeron, y esas coincidencias van al certificado:
 *
 *   "similitud 0.68 — coincidió en: medicamento (etiqueta, peso 2.20),
 *    entrega (etiqueta, peso 1.79). 2 de 5 términos con valor."
 *
 * Propiedades que importan:
 *
 *   1. Determinista. La misma consulta sobre el mismo corpus da siempre el
 *      mismo resultado, hoy y dentro de un mes. Es lo que lo hace auditable.
 *   2. Sin red y sin modelo. Corre en las pruebas y con el wifi caído.
 *   3. Explicable término a término. No hay puntaje sin razón.
 *
 * ---------------------------------------------------------------------------
 * Por qué IDF y no conteo plano
 *
 * La primera versión pesaba todos los términos igual y elegía mal: para una
 * consulta sobre entrega de medicamentos, la sentencia de citas ganaba porque
 * "orden del médico tratante" estaba en sus etiquetas. En un corpus de salud
 * todas las sentencias hablan de órdenes, médicos y servicios — esas palabras
 * no distinguen nada. "Medicamento" sí.
 *
 * IDF resuelve eso midiendo en cuántas sentencias del corpus aparece cada
 * término: cuantas menos, más vale. Se calibra solo contra el corpus que
 * exista, sin números mágicos que haya que reajustar a mano cada vez que se
 * agrega una sentencia.
 * ---------------------------------------------------------------------------
 */

/** Cuánto vale que un término aparezca en cada campo de la sentencia. */
const PESO_CAMPO = {
  etiqueta: 1.0, // curado a mano junto con la sentencia: conocimiento verificado
  tema: 0.6,
  subregla: 0.35,
} as const;

export type Campo = keyof typeof PESO_CAMPO;

/**
 * Cuántos términos con valor necesita una consulta para que su puntaje se
 * tome en serio.
 *
 * Sin esto, una consulta de la que el corpus solo reconoce una palabra —
 * "reconocimiento de pensión de vejez", donde lo único conocido es "negación"
 * — puntúa 1 de 1 y sale con 0.60, alto y de otro dominio. Una coincidencia
 * suelta no es evidencia; es una casualidad léxica.
 */
const TERMINOS_PARA_CONFIAR = 3;

export interface Coincidencia {
  termino: string;
  campo: Campo;
  /** Aporte de este término al puntaje. Va al certificado. */
  peso: number;
}

export interface Puntaje {
  similitud: number; // 0..1
  coincidencias: Coincidencia[];
  /** Términos de la consulta que el corpus podría haber respondido. */
  terminosUtiles: number;
  terminosCoincididos: number;
  /** 0..1 — cuánta evidencia aportó la consulta. Amortigua el puntaje. */
  confianza: number;
}

/**
 * Palabras que no discriminan nada en español. Las genéricas del dominio
 * jurídico NO se listan acá a propósito: de eso se encarga IDF, que las
 * descubre solo mirando el corpus en vez de que alguien las adivine.
 */
const VACIAS = new Set([
  'a', 'al', 'ante', 'con', 'contra', 'de', 'del', 'desde', 'el', 'en', 'entre',
  'hacia', 'hasta', 'la', 'las', 'lo', 'los', 'para', 'por', 'que', 'se', 'segun',
  'sin', 'sobre', 'su', 'sus', 'un', 'una', 'unas', 'unos', 'y', 'o', 'e', 'u',
  'es', 'son', 'fue', 'ser', 'esta', 'este', 'esto', 'esa', 'ese', 'eso', 'como',
  'mas', 'pero', 'si', 'no', 'ya', 'muy', 'tambien', 'donde', 'cuando', 'cual',
  'debe', 'puede', 'hace', 'tiene', 'haber', 'parte', 'cuyo', 'cuya',
]);

/** Quita tildes y baja a minúsculas. 'Neurología' y 'neurologia' son lo mismo. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // marcas diacríticas combinantes
    .toLowerCase();
}

/**
 * Raíz aproximada, para que 'medicamento' y 'medicamentos' coincidan, y
 * 'autorizacion' con 'autorizaciones'. No es un stemmer serio y no pretende
 * serlo: recorta plurales y sufijos comunes, que es lo que hace falta acá.
 */
function raiz(palabra: string): string {
  for (const sufijo of ['ciones', 'cion', 'mientos', 'miento', 'idades', 'idad', 'es', 's']) {
    if (palabra.length - sufijo.length >= 4 && palabra.endsWith(sufijo)) {
      return palabra.slice(0, palabra.length - sufijo.length);
    }
  }
  return palabra;
}

/** Parte un texto en términos con contenido, ya reducidos a su raíz. */
export function terminos(texto: string): string[] {
  const vistos = new Set<string>();
  for (const bruto of normalizar(texto).split(/[^a-z0-9ñ]+/)) {
    if (bruto.length < 4) continue;
    if (VACIAS.has(bruto)) continue;
    vistos.add(raiz(bruto));
  }
  return [...vistos];
}

export interface Puntuable {
  id: string;
  tema: string;
  subregla: string;
  etiquetas: string[];
}

interface Documento {
  fuente: Puntuable;
  etiquetas: Set<string>;
  tema: Set<string>;
  subregla: Set<string>;
  /** Unión de los tres, para contar en cuántos documentos vive cada término. */
  todos: Set<string>;
}

/**
 * Índice del corpus. Se construye una vez y se consulta muchas: guarda el IDF
 * de cada término, que es lo que hace que el puntaje se calibre solo.
 */
export class Indice {
  private readonly docs: Documento[];
  private readonly idf = new Map<string, number>();

  constructor(corpus: readonly Puntuable[]) {
    this.docs = corpus.map((fuente) => {
      const etiquetas = new Set(fuente.etiquetas.flatMap(terminos));
      const tema = new Set(terminos(fuente.tema));
      const subregla = new Set(terminos(fuente.subregla));
      return {
        fuente,
        etiquetas,
        tema,
        subregla,
        todos: new Set([...etiquetas, ...tema, ...subregla]),
      };
    });

    // Frecuencia documental: en cuántas sentencias aparece cada término.
    const df = new Map<string, number>();
    for (const d of this.docs) {
      for (const t of d.todos) df.set(t, (df.get(t) ?? 0) + 1);
    }

    // idf = log(1 + N/df). Siempre positivo, y decrece a medida que el
    // término se vuelve común. Con N=8: un término único vale 2.20, uno que
    // está en la mitad vale 1.10, uno que está en todas vale 0.69.
    const N = this.docs.length || 1;
    for (const [t, veces] of df) {
      this.idf.set(t, Math.log(1 + N / veces));
    }
  }

  get tamano(): number {
    return this.docs.length;
  }

  /** Cuánto vale un término. Cero si el corpus no lo conoce. */
  pesoDe(termino: string): number {
    return this.idf.get(termino) ?? 0;
  }

  /**
   * Puntúa una consulta contra una sentencia del corpus.
   *
   * El denominador solo cuenta los términos que el corpus **podría** haber
   * respondido. Si la consulta menciona 'neurología' y ninguna sentencia
   * habla de neurología, ese término no castiga a nadie — no es culpa de la
   * sentencia que el corpus no cubra el tema, y castigarla haría que las
   * consultas largas puntuaran siempre bajo.
   */
  puntuar(consulta: string, id: string): Puntaje {
    const doc = this.docs.find((d) => d.fuente.id === id);
    if (!doc) return vacio();
    return this.puntuarDoc(terminos(consulta), doc);
  }

  private puntuarDoc(dela: readonly string[], doc: Documento): Puntaje {
    const utiles = dela.filter((t) => this.pesoDe(t) > 0);
    const maximo = utiles.reduce((a, t) => a + this.pesoDe(t), 0);
    if (maximo === 0) return vacio();

    const coincidencias: Coincidencia[] = [];
    let acumulado = 0;

    for (const t of utiles) {
      let campo: Campo | null = null;
      if (doc.etiquetas.has(t)) campo = 'etiqueta';
      else if (doc.tema.has(t)) campo = 'tema';
      else if (doc.subregla.has(t)) campo = 'subregla';
      if (!campo) continue;

      const peso = this.pesoDe(t) * PESO_CAMPO[campo];
      acumulado += peso;
      coincidencias.push({ termino: t, campo, peso });
    }

    // Se ordena por aporte: el certificado debe empezar por lo que más pesó.
    coincidencias.sort((a, b) => b.peso - a.peso);

    // Con poca evidencia no se puede tener mucha confianza. Una consulta de
    // la que el corpus reconoce un solo término no puede llegar a puntaje
    // pleno por acertarlo.
    const confianza = Math.min(1, utiles.length / TERMINOS_PARA_CONFIAR);

    return {
      similitud: (acumulado / maximo) * confianza,
      coincidencias,
      terminosUtiles: utiles.length,
      terminosCoincididos: coincidencias.length,
      confianza,
    };
  }

  /**
   * Puntúa toda la sentencia del corpus contra una consulta, de mayor a menor.
   *
   * `etiquetasRequeridas` es un gate determinístico previo al puntaje: si se
   * pasa, una sentencia solo compite cuando alguna de sus etiquetas cruza. Es
   * la red de seguridad que impide que un puntaje alto por casualidad produzca
   * una cita fuera de tema.
   */
  buscar(
    consulta: string,
    opciones: { etiquetasRequeridas?: readonly string[] } = {},
  ): { sentencia: Puntuable; puntaje: Puntaje; fueraDeGate: boolean }[] {
    const dela = terminos(consulta);
    const gate = (opciones.etiquetasRequeridas ?? []).flatMap(terminos);

    return this.docs
      .map((doc) => {
        const fueraDeGate =
          gate.length > 0 && !gate.some((g) => doc.etiquetas.has(g));
        return {
          sentencia: doc.fuente,
          puntaje: fueraDeGate ? vacio() : this.puntuarDoc(dela, doc),
          fueraDeGate,
        };
      })
      .sort((a, b) => b.puntaje.similitud - a.puntaje.similitud);
  }
}

function vacio(): Puntaje {
  return {
    similitud: 0,
    coincidencias: [],
    terminosUtiles: 0,
    terminosCoincididos: 0,
    confianza: 0,
  };
}

/** Frase para el certificado. Un puntaje sin razón no sirve de nada. */
export function explicarPuntaje(p: Puntaje): string {
  if (p.coincidencias.length === 0) return 'ningún término distintivo de la consulta coincidió';
  const lista = p.coincidencias
    .slice(0, 5)
    .map((c) => `${c.termino} (${c.campo})`)
    .join(', ');
  const base = `${p.terminosCoincididos} de ${p.terminosUtiles} términos con valor: ${lista}`;
  return p.confianza < 1
    ? `${base} — puntaje amortiguado: la consulta aportó poca evidencia`
    : base;
}
