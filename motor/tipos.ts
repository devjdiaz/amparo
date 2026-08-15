/**
 * AMPARO · Núcleo de tipos y memoria de hechos.
 *
 * Regla de oro portada de GarantÍA: un hecho sin origen declarado NO ENTRA.
 * En producción lo garantiza el esquema de Postgres (NOT NULL + CHECK).
 * Acá se replica en TypeScript para que las pruebas corran sin base de datos
 * y para que el mismo invariante sea visible en el repo.
 */

export type OrigenTipo =
  | 'audio'      // lo dijo la persona en la nota de voz, con minuto exacto
  | 'documento'  // salió de un archivo que subió (orden médica, negativa)
  | 'norma'      // artículo de ley o decreto verificado en SUIN-Juriscol
  | 'sentencia'  // sentencia T- del corpus, con URL viva
  | 'derivado';  // lo calculó el motor a partir de otros hechos

export interface Origen {
  tipo: OrigenTipo;
  /** Referencia citable: 'audio:00:14' · 'doc:orden-medica#1' · 'norma:D2591-art7' */
  ref: string;
  /** Obligatorio cuando tipo === 'derivado': ids de los hechos que lo produjeron. */
  derivadoDe?: string[];
}

export interface Hecho {
  id: string;
  contenido: string;
  origen: Origen;
}

export class HechoSinOrigen extends Error {
  constructor(id: string, detalle: string) {
    super(`Hecho "${id}" rechazado: ${detalle}`);
    this.name = 'HechoSinOrigen';
  }
}

/**
 * Memoria de hechos. La única puerta de entrada al sistema.
 * No hay forma de meter una afirmación sin decir de dónde salió.
 */
export class Memoria {
  private readonly hechos = new Map<string, Hecho>();

  agregar(hecho: Hecho): Hecho {
    const { id, origen } = hecho;

    if (!origen || typeof origen.ref !== 'string' || origen.ref.trim() === '') {
      throw new HechoSinOrigen(id, 'origen vacío');
    }
    if (origen.tipo === 'derivado' && !origen.derivadoDe?.length) {
      throw new HechoSinOrigen(id, 'un hecho derivado debe declarar de qué hechos salió');
    }
    if (origen.tipo === 'derivado') {
      for (const padre of origen.derivadoDe!) {
        if (!this.hechos.has(padre)) {
          throw new HechoSinOrigen(id, `deriva de "${padre}", que no está en la memoria`);
        }
      }
    }
    if (this.hechos.has(id)) {
      throw new HechoSinOrigen(id, 'id duplicado');
    }

    this.hechos.set(id, hecho);
    return hecho;
  }

  tiene(id: string): boolean {
    return this.hechos.has(id);
  }

  obtener(id: string): Hecho | undefined {
    return this.hechos.get(id);
  }

  todos(): Hecho[] {
    return [...this.hechos.values()];
  }

  /** Cadena de trazabilidad de un hecho hasta sus orígenes primarios. */
  trazar(id: string): Origen[] {
    const hecho = this.hechos.get(id);
    if (!hecho) return [];
    if (hecho.origen.tipo !== 'derivado') return [hecho.origen];
    return hecho.origen.derivadoDe!.flatMap((padre) => this.trazar(padre));
  }
}

/**
 * Un campo del expediente siempre viaja con el hecho que lo sustenta.
 * valor sin hecho es imposible por construcción: si no hay hecho, no hay valor.
 */
export interface Campo<T> {
  valor: T;
  hecho: string;
}

/** Construye un campo. Falla si el hecho no existe en la memoria. */
export function campo<T>(memoria: Memoria, valor: T, hechoId: string): Campo<T> {
  if (!memoria.tiene(hechoId)) {
    throw new HechoSinOrigen(hechoId, 'no existe en la memoria');
  }
  return { valor, hecho: hechoId };
}

/** Ausencia explícita. No es `false`, es "no lo sabemos todavía". */
export type Quizas<T> = Campo<T> | null;

export function valor<T>(c: Quizas<T>): T | null {
  return c ? c.valor : null;
}

export function ids(...campos: Quizas<unknown>[]): string[] {
  return campos.filter((c): c is Campo<unknown> => c !== null).map((c) => c.hecho);
}

/**
 * Vista estructurada del caso. Todo campo es Quizas: null significa
 * "el audio no lo dijo y ningún documento lo respalda".
 */
export interface Expediente {
  // --- compuertas ---
  solicitanteEsTitular: Quizas<boolean>;
  titularPuedeActuarPorSiMismo: Quizas<boolean>;
  fechaVulneracion: Quizas<string>;          // ISO 'YYYY-MM-DD'
  vulneracionContinua: Quizas<boolean>;
  solicitudFormalPrevia: Quizas<boolean>;
  urgenciaClinica: Quizas<boolean>;
  tutelaPreviaMismosHechos: Quizas<boolean>;
  hechosNuevos: Quizas<boolean>;

  // --- fuerza del caso ---
  sujetoEspecialProteccion: Quizas<string>;  // 'adulto mayor 71 años', 'gestante', ...
  ordenMedicaVigente: Quizas<boolean>;
  negacionDocumentada: Quizas<boolean>;
  diasEspera: Quizas<number>;
  diasReglamentarios: Quizas<number>;

  // --- consulta al recuperador ---
  servicio: Quizas<string>;                  // 'cita con especialista en neurología'
  tipoNegacion: Quizas<string>;              // 'no asignación', 'no entrega', ...
  entidad: Quizas<string>;
}

export const expedienteVacio: Expediente = {
  solicitanteEsTitular: null,
  titularPuedeActuarPorSiMismo: null,
  fechaVulneracion: null,
  vulneracionContinua: null,
  solicitudFormalPrevia: null,
  urgenciaClinica: null,
  tutelaPreviaMismosHechos: null,
  hechosNuevos: null,
  sujetoEspecialProteccion: null,
  ordenMedicaVigente: null,
  negacionDocumentada: null,
  diasEspera: null,
  diasReglamentarios: null,
  servicio: null,
  tipoNegacion: null,
  entidad: null,
};
