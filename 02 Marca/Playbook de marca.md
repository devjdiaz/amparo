---
title: Playbook de marca
tags:
  - amparo/marca
aliases:
  - AMPARO playbook de marca
---

# AMPARO · Playbook de marca

> Justicia al alcance de todos.
> Guía de identidad para logo, producto, video y repositorio.

Ver también: [[Documento maestro#5 · Sistema de marca]] · Assets: [[02 Marca/assets/README|02 Marca/assets]] · Aplicado en pantallas reales: [[Diseño UI]]

---

## 1 · La idea antes del color

**Amparo** es la palabra técnica de la protección constitucional en casi toda Latinoamérica. También es un nombre de mujer común en el campo colombiano. Esa doble lectura es la marca entera: algo institucional que suena a persona.

### Qué siente el usuario cuando llega

No llega emocionado. Llega cansado. Le negaron una cita cuatro veces, tiene un papel que no entiende, y ya le dijeron que sin abogado no hay nada que hacer. Puede que le dé pena no saber escribir una tutela.

Eso define el tono visual con más precisión que cualquier moodboard:

**La esperanza que damos no es alegría. Es dignidad y compañía.**

Por eso la marca no puede ser brillante, juvenil ni optimista de más. Un producto demasiado alegre frente a alguien que la está pasando mal se siente burlón. Lo que tranquiliza es lo contrario: calidez, calma, solidez, y la sensación de que alguien serio se está haciendo cargo.

**Referencia emocional correcta:** una carta bien escrita que alguien redactó por ti.
**Referencia emocional incorrecta:** una app de bienestar.

---

## 2 · Decisión de color

El punto de partida es verde esperanza, y estoy de acuerdo. Pero hay que tomarlo con dos advertencias antes de fijarlo:

**Advertencia 1 — el verde en Colombia tiene dueño político.** El verde limón y el verde brillante están fuertemente asociados a un partido. Un producto de acceso a la justicia leído como partidista pierde a media población de entrada. La forma de evitarlo es no usar verdes claros ni saturados de alto brillo: irse a un verde profundo, de jade o selva, que lee como institucional y natural, no como campaña.

**Advertencia 2 — el deck del hackathon ya es verde neón sobre negro.** Si AMPARO usa esa misma familia, se disuelve dentro de la marca del evento y el video no se distingue. El verde profundo sobre papel cálido resuelve las dos advertencias al tiempo.

### Paleta

**Verde Amparo — primario**
Confianza, crecimiento, lo que sigue vivo. Es el color de la decisión favorable y de la marca.

| Token | Hex | Uso |
|---|---|---|
| `verde-900` | `#06241C` | Texto sobre fondos verdes claros |
| `verde-800` | `#0A3B2E` | Titulares sobre papel, superficies oscuras |
| `verde-700` | `#0D5643` | Hover de primario |
| `verde-600` | `#12735A` | **Primario. Botones, marca, énfasis.** |
| `verde-400` | `#4FB394` | Estados activos, indicadores |
| `verde-200` | `#A8DBC8` | Bordes suaves |
| `verde-50` | `#EFF7F3` | Fondos de bloque, tarjetas de éxito |

**Ámbar Ruta — secundario**
No es alerta ni error. Es "por aquí no, pero sí por acá". Es el color de la ruta alterna, y esa decisión es la más importante de todo el playbook. Ver sección 6.

| Token | Hex | Uso |
|---|---|---|
| `ambar-700` | `#8A4A12` | Texto sobre ámbar claro |
| `ambar-500` | `#C97A22` | **Ruta alterna, avisos, acentos cálidos** |
| `ambar-300` | `#EFB569` | Bordes, subrayados |
| `ambar-50` | `#FBF0DF` | Fondos de bloque de ruta alterna |

**Papel y tinta — neutrales**
El producto entrega un documento. La interfaz debe recordar al papel, no a un dashboard.

| Token | Hex | Uso |
|---|---|---|
| `papel` | `#FBF9F4` | **Fondo principal de toda la app** |
| `papel-2` | `#FFFFFF` | Tarjetas y superficies elevadas |
| `linea` | `#E3E0D8` | Bordes hairline |
| `tinta-suave` | `#5A6661` | Texto secundario |
| `tinta` | `#14201C` | **Texto principal. Negro verdoso, nunca #000** |

**Rojo Falla — reservado**
`#A32D2D`. Se usa **únicamente** cuando el sistema falla: se cayó una fuente, no se pudo transcribir, error técnico. Nunca para decirle a una persona que su caso no procede.

### Regla de oro del color

> El verde es para lo que avanza. El ámbar es para lo que se redirige. El rojo es para lo que se rompió **del lado del sistema**, jamás del lado de la persona.

---

## 3 · Tipografía

Tres roles, tres familias. Todas gratuitas en Google Fonts.

| Rol | Familia | Por qué |
|---|---|---|
| **Titulares** | Source Serif 4 | La serif comunica documento, oficio y autoridad. Es lo que el usuario necesita ver: esto es serio, esto vale ante un juez. |
| **Interfaz y cuerpo** | Inter | Neutral, legible en pantallas malas y a tamaños pequeños. Sin personalidad que compita. |
| **Certificado de auditoría** | JetBrains Mono | La monoespaciada dice "esto lo produjo una máquina y se puede verificar". Refuerza la trazabilidad. |

**Escala**

```
Display    36 / 40   Source Serif 4, 600
H1         28 / 34   Source Serif 4, 600
H2         22 / 28   Source Serif 4, 600
H3         18 / 24   Inter, 600
Cuerpo     16 / 26   Inter, 400   ← nunca menos de 16 en móvil
Apoyo      14 / 20   Inter, 400
Certificado 13 / 20  JetBrains Mono, 400
```

Cuerpo a 16px es innegociable. Buena parte de los usuarios son personas mayores leyendo en un teléfono con la pantalla rayada.

---

## 4 · Logo

### Concepto recomendado — "La A que cubre"

La letra A **es** un techo. Amparo significa refugio. El logo no necesita inventar una metáfora: ya está en el nombre.

```
        ╱╲
       ╱  ╲
      ╱ ●  ╲
     ╱______╲
```

Un vértice angular —limpio, geométrico, con el travesaño ligeramente bajo— y debajo un punto sólido: la persona que está protegida. El punto va en `ambar-500` cuando el resto es `verde-600`; en la versión de un solo color, el punto se convierte en calado.

**Por qué funciona:**
- Se explica solo: techo + persona debajo = amparo.
- Sobrevive a 16 píxeles. El favicon es solo el vértice y el punto.
- No usa balanza, martillo, escudo ni una mano abierta. Todo eso está agotado y además dice "tribunal", que es justo lo que intimida al usuario.

**Construcción:** el vértice se traza sobre una retícula de 24×24. Ángulo de apertura entre 52° y 58° — más cerrado se ve agresivo, más abierto pierde la lectura de techo. Terminaciones a inglete, sin redondeo: el redondeo lo vuelve infantil.

### Concepto alterno — "El brote bajo el techo"

Mismo techo, y debajo un brote de dos hojas en vez del punto. Suma la lectura de esperanza y de campo. Cuesta más a tamaños pequeños; úsenlo solo si el mark principal se siente demasiado frío.

### Logotipo

`AMPARO` en Source Serif 4 Semibold, versalitas, tracking `+0.08em`. En `verde-800` sobre papel. El símbolo a la izquierda, separado por un espacio igual al ancho del vértice.

Bajo el logotipo, opcional, la bajada en Inter 400: **Justicia al alcance de todos.**

### Reglas

| | |
|---|---|
| **Área de protección** | Igual a la altura de la A por los cuatro lados |
| **Tamaño mínimo** | 24px de alto para el lockup completo; 16px para el símbolo solo |
| **Versión monocromo** | `verde-800` sobre papel · papel sobre `verde-800` · negro puro solo para radicación impresa |
| **Nunca** | Degradados, sombras, contornos, rotarlo, meterlo en un círculo, ponerlo sobre foto sin caja sólida |

### Errores corregidos en la v2 (registro para no repetirlos)

1. **Símbolo descentrado 40px** respecto al wordmark. Verificar siempre que el centro geométrico del símbolo coincida con el `text-anchor` del texto.
2. **Fondo propio dentro del archivo.** Un logo nunca carga su fondo: aparece como rectángulo sobre cualquier superficie que no sea papel.
3. **Texto sin trazar.** Con `font-family` declarada, el logo se renderiza distinto en cada máquina. Convertir a curvas antes de entregar.
4. **Cabeza flotando** a 27px del cuerpo. A tamaño favicon se lee como dos manchas sueltas.
5. **Base curva decorativa.** Desaparecía bajo 48px y competía con el techo. Eliminada.

### Archivos de marca

Ver [[02 Marca/assets/README|02 Marca/assets]] para el pack completo (lockups, símbolo, mono, favicon, OG image) y sus reglas de uso específicas.

---

## 5 · Voz

### Trate de usted

Sí, "usted". No es distancia: en buena parte de Colombia, y especialmente fuera de las grandes ciudades y con personas mayores, el usted **es** la forma de respetar. El tuteo desde una institución digital puede leerse como confianzudo con alguien que llega sintiéndose menospreciado.

### Cuatro reglas

**1. El lenguaje jurídico va adentro del documento, nunca en la interfaz.**
El PDF puede decir "subsidiariedad". La pantalla dice "hay otro camino que le sirve más y es más rápido".

**2. Nunca prometa que va a ganar.**
"Tres de cada cuatro tutelas en salud son concedidas" es un dato. "Usted va a ganar" es mentira y es cruel si el juez falla en contra.

**3. Un "no" nunca se entrega solo.**
Esta regla es de producto y de marca al tiempo. Toda negativa sale con la razón y con la puerta que sí está abierta.

**4. Diga lo que el sistema no sabe.**
Si una fuente se cayó, se dice. La confianza se construye admitiendo el hueco, no tapándolo.

### Microcopy

| En vez de | Diga |
|---|---|
| "Error: solicitud rechazada" | "Su caso no va por tutela. Le explico por qué y qué sí le sirve." |
| "Procesando su solicitud..." | "Estoy revisando su caso. Un momento." |
| "Complete los campos obligatorios" | "Me faltan tres datos para poder escribir su tutela." |
| "Su tutela fue generada exitosamente" | "Su tutela está lista. Así se radica." |
| "No se encontró jurisprudencia relevante" | "No encontré una sentencia que aplique a este caso, así que no cité ninguna. La tutela va con los argumentos verificados." |

---

## 6 · La decisión de diseño más importante

**El "no procede" no es rojo. Es ámbar.**

Cuando alguien lleva meses peleando con su EPS y por fin encuentra una herramienta que le va a ayudar, un rectángulo rojo que diga "rechazado" reproduce exactamente la experiencia institucional que lo trajo hasta aquí.

Un bloque en `ambar-50` con borde `ambar-300`, encabezado en `ambar-700`, que dice qué pasó y a dónde ir, comunica lo contrario: no lo estamos rechazando, lo estamos reencaminando.

```
┌─────────────────────────────────────────────┐
│  Este caso no va por tutela                 │  ambar-700, Serif 22
│                                             │
│  Todavía no ha pedido la cita formalmente   │  tinta, Inter 16
│  a la EPS, y el juez le va a decir que use  │
│  primero ese camino.                        │
│                                             │
│  Lo que sí le sirve hoy:                    │  tinta, Inter 16, 600
│  → Derecho de petición a la EPS  [Generar]  │  verde-600
│  → Queja ante la Supersalud      [Cómo]     │
│                                             │
│  Si en 15 días no le responden, vuelva.     │  tinta-suave, 14
│  Ahí sí procede la tutela.                  │
└─────────────────────────────────────────────┘
```

Esa última línea —"vuelva, ahí sí procede"— es la marca entera en una frase.

---

## 7 · Aplicación en producto

**Fondo.** `papel` en toda la app. Nunca blanco puro, nunca fondo oscuro. El blanco puro cansa y el modo oscuro no dice "documento".

**Botón primario.** Fondo `verde-600`, texto `papel`, radio 8px, altura mínima 48px. Cuarenta y ocho, no cuarenta: hay gente radicando esto con las manos temblando.

**El certificado de auditoría.** Bloque en `papel-2` con borde `linea`, todo en JetBrains Mono 13px, `tinta-suave`. Las fuentes consultadas en `verde-600`, las que no se consultaron en `tinta-suave` con su motivo al lado. Nunca esconder una fuente caída.

**Los tres interruptores.** Track apagado en `linea`, encendido en `verde-600`. Etiqueta en Inter 14 `tinta`. Cuando se apaga el recuperador, las citas no desaparecen en silencio: se reemplazan por una línea en `ambar-500` que dice "sin fuente verificable, no se cita".

**Enlaces a sentencias.** `verde-700`, subrayado con `verde-200` a 2px de offset. Que se vean como enlaces reales: el clic que abre la sentencia verdadera es el momento del video.

**Nunca color solo.** Todo estado lleva además texto o ícono. Hay usuarios daltónicos y hay pantallas destrozadas por el sol.

**Contraste.** `tinta` sobre `papel` y `papel` sobre `verde-600` cumplen AA holgado. Verificar cualquier combinación nueva antes de usarla.

---

## 8 · Aplicación en el video de 60 segundos

- Fondo `papel` de principio a fin. Nada de negro cinematográfico: rompe con el producto.
- Sin intro de logo. El logo aparece solo en la placa final, 5 segundos.
- Placa de cierre: fondo `verde-800`, texto `papel`, dato en Source Serif 4 grande.
- Un solo momento en ámbar: el caso improcedente. Que se note el cambio de color, porque ese cambio es el argumento.
- Sin música épica. Silencio o algo mínimo. El producto habla.

Guion completo minuto a minuto: [[Brief 24h#8 · Guion del video — 60 segundos exactos]].

---

## 9 · Lo que AMPARO no es visualmente

| No | Por qué |
|---|---|
| Balanzas, martillos, columnas griegas | Dicen tribunal. El tribunal es el lugar que le da miedo al usuario. |
| Verde limón o neón | Lectura partidista en Colombia, y se confunde con la marca del evento |
| Modo oscuro como principal | El producto es un documento, no una consola |
| Ilustraciones de gente sonriendo | Nadie llega aquí contento. Se siente falso. |
| Rojo para decisiones sobre la persona | Reproduce el maltrato institucional que la trajo |
| Emojis en la interfaz | El usuario necesita que esto se vea válido ante un juez |

---

## 10 · Tokens listos para pegar

```css
:root {
  --verde-900: #06241C;
  --verde-800: #0A3B2E;
  --verde-700: #0D5643;
  --verde-600: #12735A;
  --verde-400: #4FB394;
  --verde-200: #A8DBC8;
  --verde-50:  #EFF7F3;

  --ambar-700: #8A4A12;
  --ambar-500: #C97A22;
  --ambar-300: #EFB569;
  --ambar-50:  #FBF0DF;

  --papel:      #FBF9F4;
  --papel-2:    #FFFFFF;
  --linea:      #E3E0D8;
  --tinta-suave:#5A6661;
  --tinta:      #14201C;

  --rojo-falla: #A32D2D;

  --serif: "Source Serif 4", Georgia, serif;
  --sans:  "Inter", system-ui, sans-serif;
  --mono:  "JetBrains Mono", ui-monospace, monospace;

  --radio: 8px;
  --toque-min: 48px;
}
```

> [!tip] En Tailwind v4
> Este mismo bloque entra directo en `@theme` sin traducción. Ver por qué en [[Stack y plan de ejecución#3 · Por qué Tailwind y no CSS plano ni Bootstrap]].
