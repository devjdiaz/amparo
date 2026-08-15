---
title: Motor de procedibilidad
tags:
  - amparo/tecnico
aliases:
  - motor
---

# Motor de procedibilidad

Código fuente: carpeta `motor/` en la raíz del repo. TypeScript puro, sin framework, sin red, sin base de datos — corre con `pnpm vitest run`.

Es la implementación de los pasos [2]–[6] del flujo descrito en [[Documento maestro#4 · Tesis arquitectónica]], y el corazón de la rúbrica: "Motor de procedibilidad completo, con pruebas. Sin LLM todavía" (bloque 12:00–15:00 en [[Stack y plan de ejecución#9 · Plan hora por hora]]).

Cómo se ve todo esto en pantalla: [[Diseño UI]] (pantallas 02 y 04 son este motor corriendo en vivo, pantalla 05 es `certificado.ts` renderizado).

> [!important] Regla de oro del motor
> El modelo de lenguaje no puede alucinar una cita porque no es quien elige las citas. Cada archivo de esta carpeta refuerza esa garantía en una capa distinta.

---

## Mapa de archivos

| Archivo | Capa | Qué garantiza |
|---|---|---|
| `tipos.ts` | Memoria de hechos | Un hecho sin origen declarado no entra — a nivel de tipos y de runtime |
| `compuertas.ts` | Procedibilidad (conjuntiva) | Las cuatro reglas legales, evaluadas siempre, sin corto circuito |
| `fuerza.ts` | Fuerza del caso (compensable) | Scorecard de pesos declarados; nunca decide si procede o no |
| `recuperador.ts` | Recuperación | Consulta determinista sobre el expediente; cero citas es un resultado válido |
| `validador.ts` | Aduana | Verifica que el texto del redactor no afirme nada sin marca `[#hecho]` |
| `certificado.ts` | Auditoría | Emite siempre, incluso cuando no procede o faltan datos |
| `casos.test.ts` | Verificación | Los tres casos de referencia, escritos antes que el LLM |

---

## `tipos.ts` — Memoria de hechos

Regla portada del proyecto GarantÍA (ver [[Bitácora hackathon CTW·2026#7 · Reuso de arquitectura]]): **un hecho sin origen declarado NO ENTRA**. En producción lo garantiza el esquema de Postgres (`NOT NULL` + `CHECK`, ver [[Stack y plan de ejecución#5 · Supabase]]); acá se replica en TypeScript para que las pruebas corran sin base de datos.

```ts
export type OrigenTipo = 'audio' | 'documento' | 'norma' | 'sentencia' | 'derivado';

export interface Origen {
  tipo: OrigenTipo;
  ref: string;              // 'audio:00:14' · 'doc:orden-medica#1' · 'norma:D2591-art7'
  derivadoDe?: string[];    // obligatorio si tipo === 'derivado'
}

export interface Hecho {
  id: string;
  contenido: string;
  origen: Origen;
}
```

La clase `Memoria` es la única puerta de entrada: `agregar()` lanza `HechoSinOrigen` si el origen está vacío, si un hecho derivado no declara de qué hechos salió, o si esos padres no existen. `trazar(id)` sube la cadena de un hecho hasta sus orígenes primarios — es la trazabilidad que se muestra en el certificado.

También define `Expediente`: la vista estructurada del caso, donde cada campo es `Quizas<T>` (o un `Campo<T>` con su `hecho` de respaldo, o `null` — "no lo sabemos todavía", nunca `false` por omisión).

---

## `compuertas.ts` — Las cuatro reglas de procedibilidad

**Conjuntivas, no compensables.** Sin pesos ni sumas: los cuatro requisitos son condiciones legales independientes, y una legitimación impecable no salva una subsidiariedad fallida.

Se evalúan **las cuatro siempre, sin corto circuito** — salir en la primera falla daría un "no" con una sola razón, y la regla de la casa es que un no nunca se entrega solo (ver [[Playbook de marca#6 · La decisión de diseño más importante]]).

```ts
export type Veredicto = 'PASA' | 'FALLA' | 'INDETERMINADO';

export interface ResultadoCompuerta {
  regla: 'legitimacion' | 'inmediatez' | 'subsidiariedad' | 'no_temeridad';
  veredicto: Veredicto;
  motivo: string;       // va a pantalla, lenguaje llano
  fundamento: string;   // va al documento, aquí sí vive la jerga jurídica
  hechos: string[];
  excepcion?: string;
  pregunta?: string;    // solo si INDETERMINADO
  ruta?: RutaAlterna;   // solo si FALLA — nunca un no seco
}
```

Cada regla corresponde a la tabla de [[Documento maestro#4 · Tesis arquitectónica]]:

| Regla | Fundamento normativo | Pregunta |
|---|---|---|
| `legitimacion` | Art. 86 C.P. · arts. 10 y 46 Decreto 2591 de 1991 | ¿La persona afectada es la misma que va a firmar? |
| `inmediatez` | `DIAS_INMEDIATEZ = 180` como referencia jurisprudencial, no plazo legal fijo | ¿Cuánto pasó desde la vulneración? |
| `subsidiariedad` | ¿Hay otro medio idóneo? ¿Perjuicio irremediable? | Enruta si falla |
| `no_temeridad` | ¿Ya hubo tutela por los mismos hechos? | Bloqueante |

Determinista: misma entrada, misma salida, para siempre. Es lo que el interruptor 2 (apagar el LLM) demuestra en la demo — ver [[00 Inicio#Los tres interruptores (lo más importante de la demo)]].

---

## `fuerza.ts` — Fuerza del caso

Aquí sí vive el scorecard de pesos declarados, también traído de GarantÍA. **Es compensable**, a diferencia de las compuertas: un sujeto de especial protección constitucional compensa una negación sin soporte escrito.

```ts
export const PESOS = {
  sujetoEspecialProteccion: 25,
  urgenciaClinica: 25,
  ordenMedicaVigente: 20,
  negacionDocumentada: 15,
  tiempoDeEspera: 15,
} as const;

export const UMBRAL_MEDIDA_PROVISIONAL = 70;
export const UMBRAL_REFUERZO = 40;
```

> [!warning] Invariante que no se rompe
> La fuerza **nunca niega**. Solo se calcula cuando las cuatro compuertas ya pasaron, y lo único que decide es: (a) si se pide medida provisional, (b) qué sentencias prioriza el recuperador, (c) qué pruebas sugerirle a la persona adjuntar. Un caso de 18/100 procede exactamente igual que uno de 92/100.

`laFuerzaNuncaNiega()` existe como aserción ejecutable de esta regla — no como chequeo real de tipos, sino como ancla que un futuro cambio no puede romper en silencio.

---

## `recuperador.ts` — Recuperación de jurisprudencia

Dos decisiones que hacen la diferencia:

1. **La consulta NO es la transcripción.** Se arma desde los campos ya estructurados del `Expediente` (`construirConsulta`), así que es determinista y reproducible: el mismo caso produce la misma consulta y el mismo corpus produce las mismas citas. Eso es lo que hace auditable al recuperador.
2. **El umbral es duro y el resultado puede ser CERO.** `UMBRAL_SIMILITUD = 0.78`, `TOP_K = 5`. Preferimos entregar una tutela sin jurisprudencia y decirlo, que entregarla con una sentencia traída de los pelos.

```ts
export interface Sentencia {
  id: string;              // 'T-760/08'
  url: string;             // relatoría de la Corte, verificada
  tema: string;
  subregla: string;        // curada a mano — lo único que el redactor puede parafrasear
  verificadaEl: string;    // ISO; si está vieja, se declara en el certificado
}
```

`filtrarCandidatas` separa lo que pasa el umbral de lo `Descartada` (con motivo). `idsCitados` extrae qué sentencias quedaron disponibles para el redactor — es el límite duro que el interruptor 1 apaga en la demo.

---

## `validador.ts` — La aduana

El redactor (LLM) devuelve texto con marcas `[#h3]`. Este módulo verifica, **sin modelo y sin red**, que ese texto no diga nada que el sistema no pueda respaldar. Convierte "no alucinamos" de promesa a prueba ejecutable.

Tres reglas:

1. Toda afirmación de hecho lleva al menos una marca `[#id]`.
2. Toda marca existe en la `Memoria`.
3. Toda sentencia citada (patrón `T-\d+/\d+`) viene de las que entregó el recuperador. Si el recuperador devolvió cero, el texto debe tener cero sentencias.

Si algo falla, el texto no se publica: no hay grado de confianza, hay `ok: true/false` y una lista de `Violacion[]`. `recortarOfensoras()` implementa la política de reintento: se le devuelven al modelo sus propias violaciones; si vuelve a fallar, se recorta la oración ofensora y queda declarado en el certificado — nunca pasa en silencio.

---

## `certificado.ts` — Certificado de auditoría

Se emite **siempre**, incluso cuando el caso no procede y cuando faltan datos. Un certificado que solo aparece en el éxito no es auditoría, es marketing.

```ts
export interface Certificado {
  casoId: string;
  emitidoEl: string;
  motorVersion: string;      // MOTOR_VERSION = '1.0.0'
  reglasHash: string;
  corpusVersion: string;
  procedibilidad: Procedibilidad;
  fuerza: Fuerza | null;         // null cuando no procede o faltan datos
  recuperacion: Recuperacion | null;
  validacion: Validacion | null;
  interruptores: Interruptores;  // { recuperadorActivo, llmActivo } — a propósito
}
```

`Interruptores` vive en el certificado a propósito: el estado de los dos controles queda registrado como parte de la auditoría, no solo mostrado en pantalla. Regla portada de GarantÍA: una fuente caída se declara, nunca se esconde (ver [[Playbook de marca#7 · Aplicación en producto]]).

---

## `casos.test.ts` — Suite de verificación

Se escribe **antes** que el LLM. Es lo único que avisa a las cinco de la mañana que algo se rompió. Corre sin red, sin base de datos y sin modelo:

```
pnpm vitest run
```

Cubre, como mínimo, los tres casos de referencia de [[Documento maestro#12 · Verificación]] / [[Brief 24h#12 · Verificación]]:

1. Negación de cita con especialista → procede → PDF con jurisprudencia
2. No entrega de medicamento → procede → PDF con jurisprudencia
3. Caso improcedente por subsidiariedad → no procede → ruta alterna

Más los invariantes de cada capa: memoria que rechaza hechos sin origen, compuertas que nunca hacen corto circuito, fuerza que nunca niega, validador que nunca deja pasar una cita no recuperada.

---

## Cómo se relaciona con el stack final

Este motor es TypeScript puro y no depende de Next.js ni de Supabase — por diseño, para que corriera desde la hora 3 sin nada más montado (ver [[Stack y plan de ejecución#9 · Plan hora por hora]], bloque 11:20–13:00). Al integrarlo:

- `Memoria` se reemplaza (o se respalda) por la tabla `hechos` de Postgres con el mismo invariante a nivel de esquema — ver [[Stack y plan de ejecución#5 · Supabase]].
- `recuperador.ts` pasa de un corpus en memoria a `match_sentencias` sobre pgvector.
- El LLM (Anthropic SDK) entra únicamente como el redactor que produce texto con marcas `[#id]`, que `validador.ts` audita antes de que llegue al PDF.
