---
title: Idea original
tags:
  - amparo/producto
  - amparo/historico
aliases:
  - IDEA-AMPARO
---

# AMPARO — Tu tutela en 5 minutos, desde WhatsApp

> **Track 02 — Tecnología para la Justicia** (`JUSTICE_MODULE`)
> Asistente de IA que convierte un audio de WhatsApp en una acción de tutela lista para radicar, con jurisprudencia real citada y seguimiento hasta el fallo.

> [!info] Primer brief, previo a la calibración a 23 horas
> Este documento asume equipo de 4 personas y canal WhatsApp desde el arranque. La versión ejecutada, calibrada para una sola persona en 23 horas, está en [[Brief 24h]] y [[Stack y plan de ejecución]]. Se conserva completo porque el guion de demo y el análisis de riesgos siguen siendo útiles.

---

## 1. El problema (con datos duros)

En Colombia existe el mejor mecanismo de justicia rápida del continente: la **acción de tutela**. Es gratuita, no requiere abogado, cualquier juez debe recibirla y tiene que fallarse en **10 días hábiles**.

El problema no es el mecanismo. Es **quién sabe usarlo**.

| Dato | Cifra | Fuente |
|---|---|---|
| Tutelas en salud en 2025 | ~312.500 | Defensoría del Pueblo |
| % del total de tutelas que son de salud | 34% (→ ~900.000 tutelas/año en total) | Defensoría del Pueblo |
| Crecimiento de tutelas 2020–2025 | +162% | Defensoría del Pueblo |
| Tasa de concesión (tutelas que ganan) | **74,3%** | Defensoría del Pueblo |

### El insight que sostiene todo el proyecto

> Los departamentos con **mayor pobreza multidimensional** son los que **menos tutelas** presentan.
> — Informe Defensoría del Pueblo, abril 2026

Léelo otra vez. **3 de cada 4 tutelas ganan**, pero quien más necesita el mecanismo es quien menos lo usa. Antioquia concentra el 20,5% de las tutelas del país; los departamentos pobres, casi ninguna.

**La barrera no es legal, es de redacción.** Una tutela exige estructura formal (hechos, pretensiones, fundamentos de derecho, juramento de no haber presentado otra tutela por lo mismo). Quien no sabe escribirla, no reclama. O paga $150.000–$400.000 a un tramitador que hace copy-paste de una plantilla.

**AMPARO elimina esa barrera.**

---

## 2. La solución

Un bot de **WhatsApp** (canal, no app: cero fricción, funciona en gama baja y con poco dato).

```
Usuario:  🎤 "La EPS me negó la cita con el neurólogo, llevo 4 meses
             esperando y el médico dijo que era urgente"
                              ↓
AMPARO:   1. Transcribe y entiende el caso en lenguaje coloquial
          2. Clasifica: derecho a la salud (art. 49 CP) + vida digna (art. 11)
          3. Hace 4 preguntas faltantes (EPS, fechas, ciudad, cédula)
          4. Recupera jurisprudencia REAL de la Corte Constitucional
             aplicable al caso (sentencias T-)
          5. Verifica requisitos de procedibilidad
          6. Genera el PDF de la tutela lista para radicar
          7. Explica en 3 líneas dónde radicarla y qué pasa después
                              ↓
          📄 tutela_lista.pdf  +  ⏰ recordatorio al día 10
```

### Los 3 diferenciadores (esto es lo que lo separa de "pedirle a ChatGPT que escriba una tutela")

**1. Capa de procedibilidad (la que evita que la rechacen)**
Las tutelas no se pierden por mal argumento, se pierden por requisitos formales. AMPARO valida antes de generar:
- **Legitimación** — ¿quién la presenta es el afectado o agente oficioso?
- **Inmediatez** — ¿pasó demasiado tiempo desde la vulneración?
- **Subsidiariedad** — ¿hay otro medio de defensa idóneo? ¿aplica perjuicio irremediable?
- **No temeridad** — ¿ya presentó otra tutela por los mismos hechos?

Si algo falla, no genera el documento: **explica qué falta y qué hacer en su lugar** (p. ej. derecho de petición primero, o queja ante la Supersalud).

**2. Citas verificables o no cita (anti-alucinación)**
RAG sobre sentencias reales. Cada sentencia citada en el PDF lleva su **link a la relatoría de la Corte Constitucional**. Si el retriever no trae respaldo, el modelo argumenta sin inventar número de sentencia. Regla dura del sistema: **cero citas sintéticas**.

**3. Ciclo de vida completo, no un documento suelto**
- Día 0: radica → AMPARO guarda el caso
- Día 10: "¿ya te respondieron?"
- Si no cumplen → genera **incidente de desacato** (el 90% de la gente no sabe que existe)
- Si la niegan → genera la **impugnación** (3 días de plazo)

Ahí está el producto. Lo demás es un prompt.

---

## 3. Arquitectura del MVP

```
WhatsApp Cloud API
        │
        ▼
 Orquestador (FastAPI / Node)
        │
        ├─► Whisper ──────────► transcripción de audio (voz → texto)
        │
        ├─► LLM clasificador ─► derecho vulnerado + slots faltantes
        │
        ├─► RAG ──────────────► vector DB con sentencias T- de la Corte
        │                       (embeddings + búsqueda semántica)
        │
        ├─► Validador ────────► reglas de procedibilidad (código, no LLM)
        │
        └─► Generador ────────► plantilla jurídica → PDF (WeasyPrint)
                                + guarda caso → recordatorios
```

**Stack sugerido (versión original):** Python/FastAPI · Claude API · Whisper · pgvector o Chroma · WeasyPrint · Supabase · WhatsApp Cloud API (o Telegram si el aprovisionamiento tarda).

> [!note] Stack ejecutado
> El stack definitivo terminó siendo TypeScript + Next.js de punta a punta. Ver [[Stack y plan de ejecución#2 · Stack definitivo]].

### Datasets
| Fuente | Uso |
|---|---|
| Relatoría Corte Constitucional (sentencias T-) | Corpus de jurisprudencia para el RAG |
| SUIN-Juriscol | Normativa vigente y concordancias |
| Rama Judicial — datos abiertos | Reparto, estadísticas de tutela |
| Defensoría del Pueblo — Informe de tutelas en salud 2025 | Baseline de impacto y validación del problema |

---

## 4. Alcance para la hackathon (qué SÍ y qué NO)

### ✅ Entra en el MVP
- **Un solo vertical: salud.** Es el 34% de todas las tutelas y el dolor más agudo del país. Vertical angosto = demo que funciona de verdad.
- 3 sub-casos: negación de cita con especialista · no entrega de medicamento · negación de procedimiento autorizado
- Corpus de ~200–500 sentencias T- de salud (no hace falta el universo completo)
- Flujo completo audio → PDF
- Validador de procedibilidad
- Recordatorio al día 10 (puede ser un cron simple)

### ❌ Fuera del MVP (dilo en la presentación, suma credibilidad)
- Radicación automática ante el juzgado (requiere integración institucional)
- Otros derechos (pensión, educación, debido proceso) — es el roadmap
- Desacato e impugnación funcionando (muéstralos como flujo, no como código)

---

## 5. Guion de demo (3 minutos)

1. **(0:00)** Abre WhatsApp en vivo. Manda una nota de voz hablando **mal**, con muletillas, como habla la gente real. *(No leas un guion perfecto — eso mata la credibilidad.)*
2. **(0:30)** AMPARO responde con 3 preguntas concretas. Contéstalas.
3. **(1:15)** Llega el PDF. Ábrelo en pantalla: hechos redactados, pretensiones, **y las sentencias citadas con su link**. Haz clic en un link en vivo → abre la sentencia real en la Corte. *Ese clic es el momento de la demo.*
4. **(2:00)** Manda un segundo caso que **debe ser rechazado** (p. ej. algo que va por vía ordinaria). Muestra que AMPARO **se niega a generar la tutela** y explica la ruta correcta. *Esto demuestra criterio, no solo generación.*
5. **(2:30)** Cierra con el dato: 74,3% de las tutelas ganan, pero los departamentos más pobres son los que menos tutelan. Ese es el hueco que cierra AMPARO.

> [!note] Guion ejecutado
> El evento final no tiene pitch en vivo — solo video de 60s. Guion real: [[Brief 24h#8 · Guion del video — 60 segundos exactos]].

---

## 6. Métricas de impacto

| Métrica | Cómo se mide |
|---|---|
| Tiempo de redacción | ~3 h (o $150k–$400k con tramitador) → **< 5 min, $0** |
| Tasa de admisión | % de tutelas generadas que el juez admite sin subsanar |
| Cobertura territorial | % de usuarios en municipios de categoría 5–6 |
| Precisión de citas | % de sentencias citadas verificables (meta: 100%) |
| Casos derivados correctamente | % de consultas que NO eran tutela y se enrutaron bien |

---

## 7. Riesgos y mitigaciones (los jueces van a preguntar esto)

| Riesgo | Mitigación |
|---|---|
| Alucinación de jurisprudencia | RAG con link verificable obligatorio; sin fuente, no cita número |
| ¿Es ejercicio ilegal de la abogacía? | La tutela **no requiere abogado** por diseño constitucional (art. 86 CP, Decreto 2591/91). AMPARO entrega un borrador que el ciudadano firma y radica. Se declara explícitamente que no es asesoría jurídica. |
| Datos sensibles (salud, cédula) | Cifrado en reposo, retención mínima, borrado a petición, nada de entrenar con datos de usuarios |
| Uso masivo saturando juzgados | El problema no es que la gente tutele: es que el sistema falle. Los datos anonimizados y agregados se vuelven **evidencia pública** de qué EPS y qué territorios más vulneran. |

### El segundo producto que nadie ve al principio
Cada tutela generada es un dato estructurado sobre una vulneración. A escala, AMPARO se convierte en el **mapa en tiempo real de qué EPS niega qué, dónde y con qué frecuencia** — algo que hoy solo existe con año y medio de rezago. Ese dashboard es el modelo de sostenibilidad (Defensoría, Supersalud, personerías, prensa investigativa) y toca también el Track 01.

---

## 8. Por qué este track y no los otros

| Track | Por qué no (para este equipo, en 48h) |
|---|---|
| 01 Transparencia | SECOP es un dataset excelente, pero el usuario final es el periodista/veedor, no el ciudadano. Menos impacto emocional en el pitch. *(Ver nota abajo: AMPARO acaba tocando este track por la puerta de atrás.)* |
| 03 Edtech | El impacto medible exige semanas de uso real. Imposible de demostrar en una hackathon. |
| 04 Agro/clima | Depende de datos satelitales y validación de campo. El demo se queda en un mapa bonito sin usuario. |
| **02 Justicia** | ✅ Dolor masivo y documentado · datos públicos disponibles hoy · demo emocionalmente potente en 3 min · el mecanismo legal YA existe y funciona (74,3% de éxito), solo falta el acceso. |

---

## 9. Ideas de respaldo (por si el equipo prefiere otro track)

**Track 01 — `RADAR SECOP`**
Agente que barre contratación pública y marca banderas rojas: proceso con oferente único, adjudicación en menos de X días desde publicación, proveedor constituido hace menos de 6 meses, dirección compartida entre "competidores", sobrecosto vs. histórico del mismo bien. Salida: ficha ciudadana en lenguaje simple + **derecho de petición listo para enviar** a la entidad. Dataset: SECOP II vía datos.gov.co.

**Track 04 — `COSECHA`**
Bot de WhatsApp para pequeños productores: foto de la hoja → diagnóstico de plaga + ventana de siembra según pronóstico IDEAM del municipio + alerta de helada/lluvia. El valor no es el modelo de visión, es **entregarlo por WhatsApp en voz**, para productores que no leen pantallas.

Contexto de por qué no se eligieron: [[Bitácora hackathon CTW·2026#3 · Opciones evaluadas]].

---

## 10. Nombre y posicionamiento

**AMPARO** — es el nombre técnico de la protección constitucional en casi toda Latinoamérica (México, Argentina, España usan "amparo"; Colombia usa "tutela"). Es también un nombre de mujer común en el campo colombiano. Suena a persona, no a software.

**Tagline:** *Si tienes razón, tienes derecho a que se note.*

> [!note] Tagline final
> El tagline que se fijó en el playbook de marca es *"Justicia al alcance de todos"*. Ver [[Playbook de marca#1 · La idea antes del color]].
