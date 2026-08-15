---
title: Stack y plan de ejecución
tags:
  - amparo/tecnico
aliases:
  - AMPARO stack y plan
---

# AMPARO · Stack y plan de ejecución

> Documento complementario a [[Documento maestro]].
> Consolida las decisiones técnicas y el plan de las 23 horas.
> Última actualización: agosto 2026 · Hac[k]athon CTW·2026, Track 02 — Justicia

Ver también: [[Motor de procedibilidad]] · [[Brief 24h]]

---

## 1 · Condición de partida

**Una sola persona construyendo.** No hay equipo, no hay reparto de trabajo, no hay nadie que revise en paralelo.

Esto no cambia la arquitectura del producto — la tesis del documento maestro se mantiene intacta — pero cambia todo lo demás:

| Restricción | Consecuencia |
|---|---|
| 23 horas nominales | ~19 horas reales de trabajo. El sueño no es opcional |
| Sin equipo | Cada dependencia instalada es un problema que se depura solo, de madrugada |
| Sin pitch en vivo | El repo es el pitch. Una URL viva es bonus, no requisito |
| Nivel declarado | El plan asume que las piezas nuevas del stack se explican, no se dan por sabidas |

**Criterio rector:** se elige la opción que quita trabajo, no la que suena mejor.

---

## 2 · Stack definitivo

### Núcleo

| Pieza | Qué hace |
|---|---|
| **TypeScript** | Los tipos son la mitad del argumento: un `Hecho` sin `origen` no compila |
| **Next.js (App Router)** | Frontend y backend en un repo. Las Route Handlers son la API |
| **Supabase** | Postgres gestionado + Storage para el audio + pgvector para las sentencias |
| **Vercel** | Deploy en un push. Hecho por los mismos de Next.js, cero fricción |

### Complementos

Cada uno está por lo que ahorra, no por lo que agrega.

| Pieza | Qué hace | Por qué no se puede sacar |
|---|---|---|
| **Tailwind v4** | Estilos escribiendo clases directamente en el HTML | Los tokens de [[Playbook de marca#10 · Tokens listos para pegar]] entran tal cual en `@theme`. No se cambia de archivo para estilar |
| **`next/font`** | Carga Source Serif 4, Inter y JetBrains Mono | Viene incluido en Next.js. Sin él la tipografía parpadea al cargar |
| **Zod** | Valida que un dato tenga la forma esperada | Es la aduana entre el LLM y el sistema. Lo que devuelva el modelo pasa por acá o no entra |
| **Vitest** | Corre las pruebas automáticas | Las cuatro reglas de procedibilidad se prueban solas. Puntúa en ejecución técnica |
| **SDK de Anthropic** | Habla con el modelo que redacta | — |
| **API de Whisper** | Convierte la nota de voz en texto | — |
| **pnpm** | Instala paquetes, más rápido que npm | Menor, pero se nota a las 3am |

### Excepción de estilos

**El documento generado y el certificado de auditoría van en CSS plano**, en un archivo `documento.css` aparte, con `@media print`. Ahí las utilidades de Tailwind estorban y la impresión necesita control fino de márgenes y tipografía.

---

## 3 · Por qué Tailwind y no CSS plano ni Bootstrap

**Bootstrap queda descartado por marca, no por técnica.** Sus defaults — azul, radios grandes, estética de dashboard — son exactamente lo que la sección "Lo que AMPARO no es visualmente" prohíbe (ver [[Playbook de marca#9 · Lo que AMPARO no es visualmente]]). Habría que sobrescribirlo entero, y un jurado que evalúa UX reconoce una plantilla de Bootstrap en dos segundos.

**CSS plano es técnicamente defendible**, pero con una sola persona trabajando 19 horas el costo real es el cambio de contexto: alternar entre `.tsx` y `.css` a la hora 14 es donde se pierden los minutos y donde se olvida qué token correspondía.

**Tailwind v4 gana porque los tokens ya son variables CSS.** El bloque `:root` del documento maestro entra directo en `@theme`, y a partir de ahí el vocabulario disponible es `bg-papel`, `text-tinta`, `border-linea`, `text-ambar-500`. El sistema de marca deja de ser un documento que hay que recordar y se vuelve lo único que se puede escribir.

---

## 4 · Lo que deliberadamente no va

| Descartado | Razón |
|---|---|
| **ORM (Drizzle, Prisma)** | Tres tablas y tres casos. El cliente `@supabase/supabase-js` basta |
| **Librería de componentes (shadcn, MUI)** | Traen una estética neutra que habría que desarmar contra la marca |
| **Radix** | Los tres interruptores son tres `<button role="switch">` con `aria-checked`. 15 minutos, una dependencia menos |
| **Gestor de estado (Redux, Zustand)** | El estado del caso vive en la base y en el servidor |
| **Base de vectores aparte (Pinecone, Chroma)** | pgvector está incluido en Supabase |
| **Puppeteer** | Es la trampa que más hunde equipos: instalar Chromium, pelear con serverless, y a las 7am no hay PDF. Print CSS logra lo mismo en 30 minutos y en video se ve idéntico |

---

## 5 · Supabase

### Lo que recupera

Con Postgres vuelve la garantía original del documento maestro: **un hecho sin origen no entra, y lo garantiza el esquema**, no una promesa del código. Es un punto de auditoría señalable en el README y en el video. Implementación equivalente en TypeScript (sin base de datos) en `motor/tipos.ts` — ver [[Motor de procedibilidad#Memoria de hechos]].

### Cómo usarlo

- **Cliente directo**, `@supabase/supabase-js`. Sin ORM.
- **Todo desde el servidor**, con la `SERVICE_ROLE_KEY` en Route Handlers. No hay login de usuario ni multi-tenant, así que **no se toca RLS**: pelear con políticas de permisos puede costar una hora a las 2am sin aportar nada a la demo.
- **Esquema por SQL Editor**, desde un archivo `schema.sql` versionado en el repo. Queda como evidencia, no como configuración invisible hecha a clics.

### La tabla que sostiene la tesis

```sql
create table hechos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos(id),
  contenido text not null,
  origen text not null,           -- la tesis, en el esquema
  minuto_audio int,
  constraint origen_no_vacio check (length(trim(origen)) > 0)
);
```

El `check` importa tanto como el `not null`: sin él, `origen = ''` pasa el filtro. Esa es la línea que se señala en el video.

### Recuperación

`create extension vector`, columna `embedding vector(1536)` en `sentencias`, y una función `match_sentencias` por similitud de coseno. Con 30 sentencias el coseno en memoria bastaría, pero teniendo Postgres ya montado queda mejor auditado y evita mantener un JSON de embeddings aparte.

### Audio

La nota de voz sube primero a **Supabase Storage**, y a Whisper se le pasa la URL. Nunca el blob por el body de la petición.

---

## 6 · Variables de entorno

Un `.env.local` en la máquina, y las mismas variables pegadas en el panel de Vercel.

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # solo para Whisper
```

**Regla que no se rompe:** solo lo que empieza por `NEXT_PUBLIC_` es visible en el navegador. Las otras tres viven exclusivamente dentro de Route Handlers.

Antes del primer commit, verificar con los ojos que `.env.local` está en `.gitignore`. `create-next-app` ya lo incluye, pero una llave filtrada en el repo es la única forma de arruinar el proyecto sin escribir una sola línea mala de código.

---

## 7 · Trampas conocidas

| Trampa | Cómo se evita |
|---|---|
| **Timeout de Vercel (10s en plan gratis)** | Whisper + recuperación + redactor en una sola llamada se pasa del límite. Se parte en tres Route Handlers encadenados desde el cliente — que además se ve mejor: el pipeline avanzando paso a paso *es* el argumento |
| **Deploy a última hora** | Desplegar **en la hora 2**, con la app vacía. Un "hola mundo" leyendo una fila de Supabase. Los problemas de variables de entorno aparecen con 20 horas por delante, no con 2 |
| **Caída de red en el Claustro** | **Modo fixture desde el minuto uno**: un flag que sirve transcripción y sentencias desde archivos locales. Si el WiFi se cae a las 6am mientras se graba, se graba igual |
| **Estrenar versiones** | Lo que salga de `create-next-app` el día del evento, se congela. Cero migraciones mayores durante las 23 horas |

---

## 8 · Recorte de alcance

Ajuste del documento maestro a la realidad de una sola persona.

| Del documento maestro | Versión ejecutable |
|---|---|
| Corpus de 200–400 sentencias T- | **25–30**, curadas a mano, un solo tema: negación de citas y medicamentos por EPS |
| Nota de voz en vivo | **Una** grabada previamente, transcrita con Whisper de verdad al abrir la demo |
| Casos generales | **Tres**: procede claro · procede con inmediatez justa · improcedente |
| Autoservicio ciudadano | No existe. Ni siquiera como pantalla |

**Los tres interruptores no se recortan.** Son los 50 puntos de rúbrica de impacto público y uso real de IA, comprimidos en diez segundos de video. Ver [[00 Inicio#Los tres interruptores (lo más importante de la demo)]].

---

## 9 · Plan hora por hora

| Hora | Bloque |
|---|---|
| **10:00 – 11:00** | Scaffold: `create-next-app`, tokens en `@theme`, tres fuentes, fondo papel. Modo fixture activo desde ya |
| **11:00 – 11:20** | **Deploy vacío a Vercel.** App en blanco leyendo una fila de Supabase. Solo para descubrir problemas de entorno temprano |
| **11:20 – 13:00** | Las cuatro reglas de procedibilidad en TS puro + Vitest. Los tres casos escritos **antes** que el motor. Sin LLM, sin base, sin pantallas |
| **13:00 – 14:30** | Corpus: 30 sentencias con enlace real, esquema en Supabase, embeddings a pgvector |
| **14:30 – 16:30** | UI: entrada de voz, memoria de hechos con origen visible |
| **16:30 – 18:30** | Recuperador + redactor. Primer texto generado |
| **18:30 – 20:30** | Certificado de auditoría y los tres interruptores |
| **21:00 – 23:00** | Documento de la tutela en print CSS |
| **23:00** | **CONGELAR FEATURES.** Lo que no corre a esta hora, no entra |
| **23:00 – 01:00** | Pulido, y muy especialmente el caso improcedente en ámbar |
| **01:00 – 02:15** | Grabar todas las tomas de pantalla. Sin editar, solo capturar |
| **02:15 – 04:00** | README. Es el pitch, pesa igual que el código |
| **04:00 – 07:00** | **Dormir.** No es opcional: el video se monta con la cabeza despejada o sale mal |
| **07:00 – 08:30** | Montaje del video y subida al repositorio |
| **08:30 – 09:00** | Buffer real |

---

## 10 · Cortes de emergencia

Decididos ahora, en frío, para no decidirlos a las 4am.

| Si a esta hora... | Entonces |
|---|---|
| **18:30** — no hay redactor produciendo texto | Se cae el PDF. AMPARO entrega la tutela en pantalla. Un motor que decide bien y no imprime vale más que un PDF bonito de un sistema que alucina |
| **23:00** — el deploy falla | Se graba en local y ya. El repo es el pitch |
| **Cualquier hora** — una feature nueva "mejoraría" la demo | No entra. Después de las 23:00 solo se pule |

---

## 11 · Registro de decisiones técnicas

Continúa la numeración de [[Documento maestro#9 · Registro de decisiones]].

| # | Decisión | Razón |
|---|---|---|
| 11 | Next.js App Router, un solo repo | Route Handlers como backend. Cero CORS, cero segundo deploy |
| 12 | Tailwind v4 con los tokens en `@theme` | El sistema de marca se vuelve el único vocabulario disponible. Sin cambio de contexto entre archivos |
| 13 | Bootstrap descartado | Sus defaults son literalmente lo que la marca prohíbe |
| 14 | CSS plano solo para documento y certificado | La impresión necesita control fino que las utilidades no dan |
| 15 | Supabase sin ORM | Tres tablas no amortizan una capa de abstracción |
| 16 | Sin RLS, todo desde el servidor | No hay login ni multi-tenant. Las políticas serían tiempo perdido |
| 17 | pgvector en vez de vector DB externa | Ya viene incluido. Una dependencia menos |
| 18 | Print CSS en vez de Puppeteer | Mismo resultado en video, sin el riesgo de Chromium en serverless |
| 19 | Componentes a mano, sin librería | Cualquier librería trae una estética que habría que desarmar |
| 20 | Deploy vacío en la hora 2 | Los problemas de entorno se descubren con 20 horas de margen |
| 21 | Modo fixture desde el minuto uno | La demo tiene que poder grabarse sin red |
| 22 | Motor y pruebas antes que cualquier LLM | Si el motor no corre solo a la hora 6, el problema no es el modelo |

---

## 12 · Próximos pasos

En este orden estricto:

1. **Scaffold** — comandos exactos, `globals.css` con los tokens traducidos a `@theme`, layout con las tres fuentes. ~40 minutos.
2. **Deploy vacío a Vercel** — antes de escribir lógica.
3. **Las cuatro reglas + los tres casos de prueba** — sin LLM, sin base de datos, sin pantallas. Es el corazón y es lo que más pesa en la rúbrica. Ya escrito en `motor/` — ver [[Motor de procedibilidad]].
4. **Esquema en Supabase** — cuando ya haya algo que guardar.

---

## Documentos relacionados

| Archivo | Contenido |
|---|---|
| [[Documento maestro]] | Documento maestro: producto, marca, arquitectura, voz |
| [[02 Marca/assets/README|Pack de logo]] | Archivos de marca y reglas de uso |
| [[Brief 24h]] | Alcance detallado y guion del video |
