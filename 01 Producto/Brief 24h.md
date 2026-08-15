---
title: Brief 24h
tags:
  - amparo/producto
aliases:
  - AMPARO brief 24h
---

# AMPARO

> **Track 02 — Tecnología para la Justicia** · Hac[k]athon CTW·2026
> Motor de decisión auditable aplicado a la acción de tutela.
> Entra una nota de voz. Sale una tutela lista para radicar — o un no, con razones y con ruta.

Documento maestro: [[Documento maestro]] · Marca: [[Playbook de marca]] · Ejecución: [[Stack y plan de ejecución]]

---

## 0 · Corrección de alcance que cambia toda la estrategia

- **La entrega es un video de máximo 1 minuto + código. No hay pitch en vivo.**
- **Cierre domingo 09:00. Arranque sábado 10:00. Son 23 horas reales.**

Consecuencias directas:

1. **No hay preguntas del jurado.** Nadie va a poder aclarar nada. Todo lo que quieran que se entienda tiene que estar en 60 segundos de video o en el repositorio.
2. **El README es el pitch.** Con un video de un minuto, el jurado que quiera profundizar solo tiene el repo. Ese documento pesa tanto como el código.
3. **60 segundos no alcanzan para explicar. Solo alcanzan para demostrar.** El video no debe contar qué hace AMPARO: debe mostrarlo funcionando y mostrar el momento en que se niega a inventar.

---

## 1 · El problema

En Colombia existe el mejor mecanismo de justicia rápida del continente: la acción de tutela. Gratuita, sin abogado, fallo en 10 días hábiles.

| Dato | Cifra | Fuente |
|---|---|---|
| Tutelas en salud, 2025 | ~312.500 | Defensoría del Pueblo |
| Porcentaje del total nacional | 34% | Defensoría del Pueblo |
| Crecimiento 2020–2025 | +162% | Defensoría del Pueblo |
| **Tasa de concesión** | **74,3%** | Defensoría del Pueblo |

Y el hallazgo que sostiene el proyecto entero, del informe de la Defensoría de abril de 2026:

> Los departamentos con mayores niveles de pobreza multidimensional presentan las menores tasas de tutelas.

Tres de cada cuatro tutelas ganan. Quien más las necesita es quien menos las usa. **La barrera no es legal, es de redacción.**

---

## 2 · La tesis arquitectónica

El resto del track va a construir chatbots legales. Van a funcionar bien en la demo y van a alucinar jurisprudencia — sentencias con número plausible que no existen, o que existen y dicen otra cosa. Es el modo de falla conocido de un LLM sobre dominio jurídico, y en este dominio una cita inventada no es un error cosmético: es una tutela que el juez rechaza.

AMPARO no resuelve eso con prompting. Lo resuelve con arquitectura: **el modelo de lenguaje no puede alucinar una cita porque no es quien elige las citas.**

Esa es la única frase que tiene que quedar clara en el video.

---

## 3 · Arquitectura

```
Nota de voz (WhatsApp / web)
        │
        ▼
[1] TRANSCRIPCIÓN ─────────► Whisper. Español coloquial, con muletillas.
        │
        ▼
[2] MEMORIA DE HECHOS ─────► Cada hecho entra con su origen declarado.
        │                    Hecho sin origen NO ENTRA — restricción de la
        │                    base de datos, no del código.
        ▼
[3] MOTOR DE PROCEDIBILIDAD ► Reglas declaradas, pesos visibles en pantalla.
        │                    Legitimación · Inmediatez · Subsidiariedad ·
        │                    No temeridad. Determinista, sin LLM.
        │
        ├── NO PROCEDE ────► Razones + ruta alterna. Nunca un no seco.
        │
        └── PROCEDE
                 ▼
[4] RECUPERACIÓN ──────────► Sentencias T- reales. Cada cita trae su
        │                    enlace a la relatoría. Sin respaldo → no cita.
        ▼
[5] REDACTOR ──────────────► El LLM escribe la tutela A PARTIR de hechos y
        │                    normas ya seleccionados. No elige, no decide,
        │                    no puede agregar una cita que no venga de [4].
        ▼
[6] CERTIFICADO ───────────► Qué reglas se aplicaron, con qué peso, qué
        │                    fuentes se consultaron y cuáles no, y por qué.
        ▼
    PDF listo para radicar
```

Pasos [2]–[6] implementados (sin LLM) en `motor/` — ver [[Motor de procedibilidad]].

### Las cuatro reglas de procedibilidad

No son opinión del modelo. Son código, y sus pesos están a la vista:

| Regla | Pregunta | Efecto si falla |
|---|---|---|
| Legitimación | ¿Quien presenta es el afectado o agente oficioso? | Bloqueante |
| Inmediatez | ¿Cuánto pasó desde la vulneración? | Bloqueante con excepciones |
| Subsidiariedad | ¿Hay otro medio idóneo? ¿Aplica perjuicio irremediable? | Bloqueante, enruta |
| No temeridad | ¿Ya hubo tutela por los mismos hechos? | Bloqueante |

Las tutelas no se pierden por mal argumento. Se pierden aquí.

---

## 4 · Qué se porta y qué se construye

| Componente | Origen | Trabajo |
|---|---|---|
| Patrón de memoria con origen declarado a nivel de esquema | Arquitectura conocida | Esquema nuevo para dominio jurídico |
| Motor de reglas con pesos declarados | Arquitectura conocida | Reglas nuevas: las cuatro de procedibilidad |
| LLM redactando desde razones ya calculadas | Arquitectura conocida | Prompts y plantilla jurídica nuevos |
| Certificado de auditoría por decisión | Arquitectura conocida | Adaptación de campos |
| "Nunca un no seco" con ruta alterna | Arquitectura conocida | Rutas nuevas: petición, Supersalud, personería |
| Transcripción de voz | Nuevo | Whisper |
| RAG sobre sentencias T- | Nuevo | Corpus + embeddings + retriever |
| Generación de PDF con formato de tutela | Nuevo | Plantilla + WeasyPrint |
| Canal WhatsApp | Nuevo | Cloud API o Telegram si el aprovisionamiento tarda |

Repositorio nuevo desde cero. Lo que viaja es el patrón, no los archivos. Ver origen del patrón en [[Bitácora hackathon CTW·2026#7 · Reuso de arquitectura]].

---

## 5 · Alcance de las 23 horas

### Entra

- **Un solo vertical: salud.** Es el 34% de todas las tutelas del país.
- **Tres sub-casos:** negación de cita con especialista · no entrega de medicamento · negación de procedimiento ya autorizado.
- Corpus de 200–400 sentencias T- de salud. No hace falta el universo completo.
- Flujo entero: voz → hechos → procedibilidad → jurisprudencia → PDF.
- Certificado de auditoría visible.
- Los tres interruptores de la sección 7.

### No entra — y decirlo en el README suma

- Radicación automática ante el juzgado. Requiere integración institucional.
- Otros derechos: pensión, educación, debido proceso. Es el roadmap.
- Incidente de desacato e impugnación. Se muestran como flujo, no como código.
- Autoservicio a escala. La v1 opera vía personerías, consultorios jurídicos y JAC.

Nota: el recorte real a una sola persona ejecutando (vs. equipo de 4) está en [[Stack y plan de ejecución#8 · Recorte de alcance]].

---

## 6 · Plan hora por hora

| Franja | Objetivo | Compuerta |
|---|---|---|
| **10:00–12:00** | Esquema de memoria + restricción de origen declarado. Repo, CI, docker. | La base rechaza un hecho sin origen |
| **12:00–15:00** | Motor de procedibilidad completo, con pruebas. Sin LLM todavía. | Tres casos de referencia pasan de punta a punta |
| **15:00–19:00** | Corpus de sentencias, embeddings, retriever. Enlace verificable por cita. | Una consulta devuelve 3 sentencias reales con URL viva |
| **19:00–21:00** | Redactor + plantilla + PDF. | Sale un PDF con estructura de tutela válida |
| **21:00–23:00** | Transcripción de voz y canal de entrada. | Nota de voz real entra y produce PDF |
| **23:00–02:00** | Certificado de auditoría + los tres interruptores. | Los interruptores se ven y funcionan |
| **02:00–04:00** | Turno de descanso rotativo. No negociable. | — |
| **04:00–06:00** | Endurecer. Caso que debe ser rechazado. Casos borde. | El caso de rechazo funciona |
| **06:00–07:00** | **Grabar el video.** Mínimo tres tomas. | Video de 60s exportado |
| **07:00–08:30** | README. Este documento es el borrador. | README completo |
| **08:30–09:00** | Subir todo. Verificar que el repo clona y levanta limpio. | Entregado |

Congelen las funcionalidades a las 04:00. Todo lo que se toque después de esa hora es riesgo puro.

> [!info] Este plan asumía equipo de 4
> El plan hora por hora ejecutado realmente (una sola persona, 19h útiles) está en [[Stack y plan de ejecución#9 · Plan hora por hora]].

---

## 7 · Los tres interruptores

Controles visibles en la interfaz que demuestran una afirmación en un segundo. Esto no es adorno: con 60 segundos de video, un interruptor comunica lo que tres párrafos no alcanzan.

**1 · Apagar el recuperador.** El sistema deja de citar sentencias en vez de inventarlas. El PDF sale argumentado pero sin números de sentencia, y lo dice. *Demuestra: no alucinamos.*

**2 · Apagar el LLM.** El veredicto de procedibilidad sigue saliendo idéntico. *Demuestra: la decisión nunca dependió del modelo.*

**3 · Caso improcedente.** Un segundo caso donde AMPARO se niega a generar la tutela y enruta a derecho de petición. *Demuestra: tenemos criterio, no solo generación.*

---

## 8 · Guion del video — 60 segundos exactos

| Tiempo | Qué se ve |
|---|---|
| 0:00–0:08 | Nota de voz real, hablada mal, con muletillas. Sin guion leído. |
| 0:08–0:20 | Hechos extraídos, cada uno con su origen marcado. Motor de procedibilidad corriendo, pesos a la vista. |
| 0:20–0:32 | PDF de la tutela. Zoom a una sentencia citada. **Clic al enlace, se abre la sentencia real.** |
| 0:32–0:44 | Interruptor 1: se apaga el recuperador. Las citas desaparecen, no se inventan. |
| 0:44–0:55 | Segundo caso: improcedente. AMPARO se niega y enruta. |
| 0:55–1:00 | Una placa: 74,3% de las tutelas ganan. Los departamentos más pobres son los que menos tutelan. |

Sin locución explicativa. Sin logo de tres segundos al inicio. Cada segundo gastado en presentación es un segundo menos de producto funcionando.

---

## 9 · Métricas

| Métrica | Medición |
|---|---|
| Tiempo de redacción | ~3 h o $150k–$400k con tramitador → menos de 5 min, $0 |
| Citas verificables | % de sentencias citadas con enlace vivo. Meta: 100% |
| Casos correctamente rechazados | % de consultas improcedentes enrutadas bien |
| Cobertura territorial | % de usuarios en municipios categoría 5–6 |

---

## 10 · Riesgos y respuestas — para el README, no para el escenario

| Riesgo | Respuesta |
|---|---|
| Alucinación de jurisprudencia | Imposible por arquitectura: el redactor solo puede citar lo que el recuperador entregó, y cada cita lleva enlace |
| ¿Ejercicio ilegal de la abogacía? | La tutela no requiere abogado por diseño constitucional (art. 86 CP, Decreto 2591 de 1991). AMPARO entrega un borrador que el ciudadano firma y radica |
| Datos sensibles de salud | Cifrado en reposo, retención mínima, borrado a petición, cero entrenamiento con datos de usuarios |
| Saturación de juzgados | El problema no es que la gente tutele: es que el sistema falle. Los datos agregados y anonimizados se vuelven evidencia pública de qué EPS vulnera, dónde y con qué frecuencia |

---

## 11 · Stack

TypeScript de punta a punta sobre Next.js · PostgreSQL con SQL directo · pgvector para el corpus · Whisper para transcripción · WeasyPrint para el PDF · WhatsApp Cloud API o Telegram como canal.

El motor de riesgo es un conjunto de reglas con pesos declarados, no un modelo entrenado. El modelo de lenguaje redacta a partir de razones ya calculadas: no elige la ruta, no decide la procedibilidad y no puede cambiar un veredicto.

Stack definitivo (versión ejecutada, una sola persona): [[Stack y plan de ejecución]].

---

## 12 · Verificación

Tres casos de referencia que corren de punta a punta sin levantar nada, como compuerta de calidad:

1. Negación de cita con especialista → procede → PDF con jurisprudencia
2. No entrega de medicamento → procede → PDF con jurisprudencia
3. Caso improcedente por subsidiariedad → no procede → ruta alterna

Si uno de los tres deja de dar lo que debe, algo se rompió. Esa suite se escribe **antes** que el LLM, no después. Ver `motor/casos.test.ts`.
