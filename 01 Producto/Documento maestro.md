---
title: Documento maestro
tags:
  - amparo/producto
aliases:
  - AMPARO referencia proyecto
  - Documento de referencia del proyecto
---

# AMPARO · Documento de referencia del proyecto

> Documento maestro. Consolida las decisiones de producto, marca e identidad.
> Última actualización: agosto 2026 · Hac[k]athon CTW·2026, Track 02 — Justicia

Complementa: [[Brief 24h]] · [[Playbook de marca]] · [[Stack y plan de ejecución]]

---

## 1 · Qué es AMPARO

Motor de decisión auditable aplicado a la acción de tutela.

Entra una nota de voz en lenguaje coloquial. Sale una tutela lista para radicar, con jurisprudencia real y enlazada — o un **no**, con razones y con una ruta alterna.

**Tagline:** Justicia al alcance de todos.

**Nombre:** *Amparo* es el término técnico de la protección constitucional en casi toda Latinoamérica, y también un nombre de mujer común en el campo colombiano. Algo institucional que suena a persona. Esa doble lectura es la marca entera.

**Usuario de la v1:** no es el ciudadano directamente, sino el intermediario que ya existe en el territorio — personerías municipales, consultorios jurídicos universitarios, Juntas de Acción Comunal, Defensoría. El autoservicio es v2.

---

## 2 · Restricciones del evento

| | |
|---|---|
| Inicio | Sábado 15 agosto, 10:00 |
| Cierre de entregas | Domingo 16 agosto, 09:00 |
| Tiempo real | **23 horas** |
| Entrega | Video de **máximo 1 minuto** + código al repositorio |
| Pitch en vivo | **No hay** |
| Equipo | Máximo 4 personas |

### Consecuencias de diseño

1. **No hay preguntas del jurado.** Nada se puede aclarar después. Todo debe caber en 60 segundos de video o estar en el repositorio.
2. **El README es el pitch.** Con un minuto de video, quien quiera profundizar solo tiene el repo. Ese documento pesa tanto como el código.
3. **60 segundos no alcanzan para explicar, solo para demostrar.** El video no cuenta qué hace AMPARO: lo muestra funcionando y muestra el momento en que se niega a inventar.

### Rúbrica (100 puntos)

| Criterio | Puntos |
|---|---|
| Impacto público | 25 |
| Uso real de IA | 25 |
| Demo funcional | 20 |
| Viabilidad y escala | 15 |
| Ejecución técnica y UX | 15 |

Ver mapeo completo en [[Descripción refinada#Cómo se Mapea a la Rúbrica (100 puntos)]].

---

## 3 · El problema y sus fuentes

Colombia tiene el mejor mecanismo de justicia rápida del continente: la acción de tutela. Gratuita, sin abogado, fallo en 10 días hábiles.

| Dato | Cifra | Fuente |
|---|---|---|
| Tutelas en salud, 2025 | ~312.500 | Defensoría del Pueblo, abr. 2026 |
| Porcentaje del total nacional de tutelas | 34% | Defensoría del Pueblo |
| Crecimiento 2020–2025 | +162% | Defensoría del Pueblo |
| **Tasa de concesión** | **74,3%** | Defensoría del Pueblo |
| Concentración territorial | Antioquia 20,5% · Valle 10,3% · Bogotá 9,7% | Defensoría del Pueblo |

**El hallazgo que sostiene el proyecto**, del informe de la Defensoría de abril de 2026:

> Los departamentos con mayores niveles de pobreza multidimensional presentan las menores tasas de tutelas.

Tres de cada cuatro tutelas ganan. Quien más las necesita es quien menos las usa. **La barrera no es legal, es de redacción.**

### Marco normativo

| Norma | Para qué |
|---|---|
| Art. 86 Constitución Política | La tutela no requiere abogado. Base de legitimidad del producto. |
| Decreto 2591 de 1991 | Reglamenta la acción de tutela. |
| Relatoría Corte Constitucional | Corpus de sentencias T- para el recuperador. |
| SUIN-Juriscol | Normativa vigente y concordancias. |

Verificar vigencia artículo por artículo antes de meter cualquier norma al corpus. Varias tienen apartes derogados o declarados inexequibles, y una cita a un artículo muerto destruye la credibilidad.

---

## 4 · Tesis arquitectónica

El resto del track va a construir chatbots legales. Van a funcionar en la demo y van a alucinar jurisprudencia — sentencias con número plausible que no existen. En este dominio una cita inventada no es un error cosmético: es una tutela que el juez rechaza.

AMPARO no resuelve eso con prompting sino con arquitectura:

> **El modelo de lenguaje no puede alucinar una cita porque no es quien elige las citas.**

Esa es la única frase que tiene que quedar clara en el video.

### Flujo

```
Nota de voz
    ↓
[1] Transcripción — Whisper, español coloquial
    ↓
[2] Memoria de hechos — cada hecho con origen declarado.
    Hecho sin origen NO ENTRA, garantizado por la base de datos.
    ↓
[3] Motor de procedibilidad — reglas declaradas, pesos visibles, sin LLM
    │
    ├── NO PROCEDE → razones + ruta alterna. Nunca un no seco.
    │
    └── PROCEDE
         ↓
[4] Recuperación — sentencias T- reales con enlace. Sin respaldo, no cita.
    ↓
[5] Redactor — el LLM escribe A PARTIR de hechos y normas ya elegidos.
    No decide, no calcula, no agrega citas.
    ↓
[6] Certificado — qué reglas, qué pesos, qué fuentes se consultaron y cuáles no
    ↓
PDF listo para radicar
```

Implementación de los pasos [2]–[6] (sin LLM aún): ver [[Motor de procedibilidad]] y el código en `motor/`.

### Las cuatro reglas de procedibilidad

Código, no opinión del modelo. Pesos a la vista.

| Regla | Pregunta | Efecto si falla |
|---|---|---|
| Legitimación | ¿Quien presenta es el afectado o agente oficioso? | Bloqueante |
| Inmediatez | ¿Cuánto pasó desde la vulneración? | Bloqueante con excepciones |
| Subsidiariedad | ¿Hay otro medio idóneo? ¿Perjuicio irremediable? | Bloqueante, enruta |
| No temeridad | ¿Ya hubo tutela por los mismos hechos? | Bloqueante |

Las tutelas no se pierden por mal argumento. Se pierden aquí.

### Los tres interruptores

Controles visibles que demuestran una afirmación en un segundo. Con 60 segundos de video, un interruptor comunica lo que tres párrafos no alcanzan.

1. **Apagar el recuperador** → el sistema deja de citar en vez de inventar. *No alucinamos.*
2. **Apagar el LLM** → el veredicto de procedibilidad sale idéntico. *La decisión nunca dependió del modelo.*
3. **Caso improcedente** → AMPARO se niega y enruta. *Tenemos criterio, no solo generación.*

---

## 5 · Sistema de marca

Ver el playbook completo en [[Playbook de marca]]. Resumen:

### La emoción correcta

El usuario no llega emocionado. Llega cansado. Le negaron la cita cuatro veces, tiene un papel que no entiende, y puede que le dé pena no saber escribir una tutela.

**La esperanza que damos no es alegría. Es dignidad y compañía.**

- **Referencia correcta:** una carta bien escrita que alguien redactó por ti.
- **Referencia incorrecta:** una app de bienestar.

### Por qué verde profundo y no verde brillante

1. **El verde claro y saturado en Colombia tiene lectura partidista.** Un producto de acceso a la justicia leído como de partido pierde a media población de entrada.
2. **El deck del hackathon ya es verde neón sobre negro.** Usar esa familia disuelve la marca dentro del evento.

El verde jade profundo sobre papel cálido resuelve las dos.

### Paleta (resumen — tokens completos en [[Playbook de marca#8 · Tokens]])

| Token | Hex | Uso |
|---|---|---|
| `verde-600` | `#12735A` | **Primario: botones, marca, énfasis** |
| `verde-800` | `#0A3B2E` | Titulares, superficies oscuras, logo |
| `ambar-500` | `#C97A22` | **Ruta alterna, la persona en el logo** |
| `papel` | `#FBF9F4` | **Fondo principal de toda la app** |
| `tinta` | `#14201C` | **Texto principal. Negro verdoso, nunca #000** |
| `rojo-falla` | `#A32D2D` | Únicamente cuando falla el sistema. Jamás para el usuario. |

### Regla de oro

> El verde es para lo que avanza. El ámbar para lo que se redirige. El rojo para lo que se rompió **del lado del sistema**, jamás del lado de la persona.

### La decisión de diseño más importante

**El "no procede" es ámbar, nunca rojo.** Cuando alguien lleva meses peleando con su EPS y encuentra una herramienta que le va a ayudar, un rectángulo rojo que diga "rechazado" le reproduce exactamente la experiencia institucional que lo trajo hasta aquí.

```
┌─────────────────────────────────────────────┐
│  Este caso no va por tutela                 │  ambar-700, serif 22
│                                             │
│  Todavía no ha pedido la cita formalmente   │  tinta, 16
│  a la EPS, y el juez le va a decir que use  │
│  primero ese camino.                        │
│                                             │
│  Lo que sí le sirve hoy:                    │  tinta, 16, 600
│  → Derecho de petición a la EPS  [Generar]  │  verde-600
│  → Queja ante la Supersalud      [Cómo]     │
│                                             │
│  Si en 15 días no le responden, vuelva.     │  tinta-suave, 14
│  Ahí sí procede la tutela.                  │
└─────────────────────────────────────────────┘
```

Esa última línea es la marca entera en una frase.

### Tipografía

| Rol | Familia | Por qué |
|---|---|---|
| Titulares | Source Serif 4 | La serif dice documento y oficio. Esto vale ante un juez. |
| Interfaz y cuerpo | Inter | Legible en pantallas malas, sin personalidad que compita. |
| Certificado de auditoría | JetBrains Mono | Dice "lo produjo una máquina y se puede verificar". |

Cuerpo a 16px es innegociable: buena parte de los usuarios son personas mayores con la pantalla rayada.

### Aplicación en producto

- **Fondo:** `papel` en toda la app. Nunca blanco puro, nunca modo oscuro.
- **Botón primario:** `verde-600`, texto `papel`, radio 8px, **altura mínima 48px**. Hay gente radicando esto con las manos temblando.
- **Certificado:** `papel-2` con borde `linea`, JetBrains Mono 13, `tinta-suave`. Fuentes consultadas en `verde-600`, las no consultadas en `tinta-suave` con su motivo. Nunca esconder una fuente caída.
- **Interruptores:** apagado `linea`, encendido `verde-600`. Al apagar el recuperador, las citas no desaparecen en silencio: se reemplazan por una línea `ambar-500` que dice "sin fuente verificable, no se cita".
- **Enlaces a sentencias:** `verde-700`, subrayado `verde-200` a 2px de offset. El clic que abre la sentencia real es el momento del video.
- **Nunca color solo.** Todo estado lleva además texto o ícono.

### Aplicación en el video

- Fondo `papel` de principio a fin. Nada de negro cinematográfico.
- Sin intro de logo. Aparece solo en la placa final, 5 segundos.
- Placa de cierre: fondo `verde-800`, texto `papel`, dato en serif grande.
- Un solo momento en ámbar: el caso improcedente. Que se note el cambio, porque ese cambio es el argumento.
- Sin música épica. El producto habla.

### Lo que AMPARO no es visualmente

| No | Por qué |
|---|---|
| Balanzas, martillos, columnas griegas | Dicen tribunal, y el tribunal es lo que le da miedo al usuario |
| Verde limón o neón | Lectura partidista y confusión con la marca del evento |
| Modo oscuro como principal | El producto es un documento, no una consola |
| Ilustraciones de gente sonriendo | Nadie llega aquí contento |
| Rojo para decisiones sobre la persona | Reproduce el maltrato institucional |
| Emojis en la interfaz | Esto tiene que verse válido ante un juez |

---

## 6 · Logo

Ver detalle de construcción y errores corregidos en [[Playbook de marca#4 · Logo]]. Assets en [[02 Marca/assets/README|02 Marca/assets]].

### Concepto: "La A que cubre"

La letra A **es** un techo. Amparo significa refugio. El logo no inventa metáfora: ya está en el nombre. Un vértice angular y, debajo, una persona protegida (cabeza en `ambar-500`, cuerpo en `verde-800`).

**Por qué funciona:** se explica solo, sobrevive a 16 píxeles, y no usa ninguno de los símbolos agotados del sector legal.

### Logotipo

`AMPARO` en Source Serif 4 Semibold, `verde-800`, tracking +2. Símbolo arriba o a la izquierda, separado por el ancho del vértice. Bajada opcional en Inter 400 `verde-700`: *Justicia al alcance de todos.*

---

## 7 · Voz y microcopy

### Trate de usted

No es distancia. En buena parte de Colombia, y especialmente fuera de las grandes ciudades y con personas mayores, el usted **es** la forma de respetar. El tuteo desde una institución digital se lee como confianzudo con alguien que llega sintiéndose menospreciado.

### Cuatro reglas

1. **El lenguaje jurídico va adentro del documento, nunca en la interfaz.** El PDF puede decir "subsidiariedad". La pantalla dice "hay otro camino que le sirve más y es más rápido".
2. **Nunca prometa que va a ganar.** "Tres de cada cuatro tutelas en salud son concedidas" es un dato. "Usted va a ganar" es mentira y es cruel si el juez falla en contra.
3. **Un "no" nunca se entrega solo.** Toda negativa sale con la razón y con la puerta que sí está abierta.
4. **Diga lo que el sistema no sabe.** Si una fuente se cayó, se dice. La confianza se construye admitiendo el hueco.

### Microcopy

| En vez de | Diga |
|---|---|
| "Error: solicitud rechazada" | "Su caso no va por tutela. Le explico por qué y qué sí le sirve." |
| "Procesando su solicitud..." | "Estoy revisando su caso. Un momento." |
| "Complete los campos obligatorios" | "Me faltan tres datos para poder escribir su tutela." |
| "Su tutela fue generada exitosamente" | "Su tutela está lista. Así se radica." |
| "No se encontró jurisprudencia relevante" | "No encontré una sentencia que aplique a este caso, así que no cité ninguna. La tutela va con los argumentos verificados." |

---

## 8 · Tokens

Tokens completos y listos para pegar en `@theme` (Tailwind v4): ver [[Playbook de marca#10 · Tokens listos para pegar]].

---

## 9 · Registro de decisiones

| # | Decisión | Razón |
|---|---|---|
| 1 | Track 02 — Justicia | Dolor masivo y documentado, datos públicos disponibles, y el mecanismo legal ya funciona: solo falta el acceso |
| 2 | Un solo vertical: salud | 34% de todas las tutelas del país. Vertical angosto = demo que funciona de verdad |
| 3 | Usuario v1 es el intermediario, no el ciudadano | Los territorios con más informalidad tienen peor conectividad. El canal institucional no es el caso borde, es el principal |
| 4 | Motor de reglas declaradas, no modelo entrenado | Explicable, discutible y modificable. En este dominio la explicabilidad es requisito, no virtud |
| 5 | El LLM redacta, no decide | Única forma arquitectónica de garantizar que no aluciné jurisprudencia |
| 6 | Verde jade profundo, no verde brillante | Lectura partidista en Colombia y confusión con la marca del evento |
| 7 | "No procede" en ámbar, nunca en rojo | El rojo reproduce el maltrato institucional que trajo al usuario |
| 8 | Fondo papel, sin modo oscuro | Lo que se entrega es un documento |
| 9 | Trato de usted | Respeto, no distancia. Especialmente con usuarios mayores y rurales |
| 10 | Repositorio nuevo desde cero | Viaja el patrón arquitectónico, no los archivos |

Continúa en [[Stack y plan de ejecución#11 · Registro de decisiones técnicas]] (decisiones 11–22).

---

## 10 · Pendientes

- [ ] **Decidir el nombre final.** `AMPARO` a secas o conservar la IA. Recomendación: quitarla — `IAMPARO·IA` mete la IA dos veces, rompe la palabra y se pierde la doble lectura que hace fuerte al nombre. La IA va en el descriptor, no en la marca.
- [ ] Exportar los cinco archivos de logo (ver [[Playbook de marca#4 · Logo]])
- [ ] Definir los pesos numéricos de las cuatro reglas de procedibilidad
- [ ] Armar el corpus de 200–400 sentencias T- de salud
- [ ] Escribir la suite de tres casos de referencia **antes** que el LLM (ver `motor/casos.test.ts`)
- [ ] Verificar vigencia de cada norma antes de meterla al corpus
