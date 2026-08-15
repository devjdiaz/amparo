---
title: Diseño UI
tags:
  - amparo/producto
  - amparo/marca
  - amparo/tecnico
aliases:
  - amparo-ui
  - Mockup Pencil
---

# AMPARO · Diseño UI (export de Pencil)

Mockup estático exportado desde Pencil con Tailwind (`tailwind = cdn`, sin build). Vive en `05 Diseño UI/amparo-ui.html` — ábrelo directo en el navegador para verlo. Es un lienzo único de `7520×900px` con las 5 pantallas dispuestas en fila, cada una `1440×900`.

Aplica la paleta y tipografía de [[Playbook de marca]] y da forma visual a las decisiones de [[Documento maestro]] y al código de [[Motor de procedibilidad]].

---

## Las 5 pantallas

### 01 · Entrada de Voz

Fondo oscuro (única pantalla que rompe la regla de "fondo papel siempre" — es la portada, antes de entrar al flujo de documento). Botón de micrófono central en `verde-600` con glow, alternativa de texto libre, y la placa de datos de impacto: **312.500 tutelas en salud (2025) · 74,3% tasa de concesión · 34% del total nacional · +162% crecimiento 2020–2025** — los mismos datos de [[Documento maestro#3 · El problema y sus fuentes]].

> [!note] Contradice el playbook en un punto
> [[Playbook de marca#9 · Lo que AMPARO no es visualmente]] dice "modo oscuro como principal: no". Esta pantalla es oscura. Vale la pena decidir a propósito si es una portada-excepción (pantalla de "bienvenida", antes del documento) o si hay que llevarla a `papel` para ser consistentes. Revisar antes de grabar el video.

### 02 · Análisis

Stepper de 4 pasos (Entrada → Hechos → Procedibilidad → Resultado). Dos columnas:

- **Hechos extraídos** — cada hecho numerado con su origen (`Declaración del paciente`, `Documento referenciado`), igual al patrón `Hecho.origen` de `motor/tipos.ts` (ver [[Motor de procedibilidad#`tipos.ts` — Memoria de hechos]]).
- **Motor de procedibilidad** — las cuatro reglas (`Legitimación · Inmediatez · Subsidiariedad · No temeridad`), cada una marcada `BLOQUEANTE`, con la pregunta y el veredicto (✓/✗) en lenguaje llano. Corresponde 1:1 a `ResultadoCompuerta` en `motor/compuertas.ts`.
- Veredicto final: **"TUTELA PROCEDE — Las 4 reglas de procedibilidad se cumplen"**.

### 03 · Tutela Generada

El documento en sí (`ACCIÓN DE TUTELA`, encabezado `SEÑOR JUEZ DE TUTELA (REPARTO)`, secciones `I. HECHOS` / `II. FUNDAMENTOS DE DERECHO`), con jurisprudencia citada mostrando **relevancia %** por sentencia (T-760/08 · T-121/15 · T-259/19) — esto es la salida de `filtrarCandidatas` en `motor/recuperador.ts`.

**Interruptores de auditoría**, panel lateral con tres toggles:

| Toggle | Qué controla |
|---|---|
| Recuperador de jurisprudencia | Citas de sentencias reales con enlace |
| Modelo de lenguaje (LLM) | Redacción asistida por IA |
| Modo auditoría completa | Muestra cada decisión del motor |

> [!warning] Discrepancia con la documentación de producto
> [[00 Inicio#Los tres interruptores (lo más importante de la demo)]] y [[Documento maestro#4 · Tesis arquitectónica]] describen el tercer interruptor como **"Caso improcedente"** (cambiar de caso, no un toggle de UI). Este mockup en cambio pone **"Modo auditoría completa"** como tercer toggle, y el caso improcedente vive aparte como pantalla 04. Antes de grabar el video hay que decidir cuál de las dos versiones es la real y alinear el guion — probablemente el mockup es el diseño correcto y el caso improcedente se demuestra navegando a otra pantalla, no con un switch.

### 04 · Caso Improcedente

Mismo stepper y motor que la pantalla 02, pero acá **Subsidiariedad falla**: *"Existe recurso ante Supersalud pendiente — no se ha agotado"*, lo que deja `No temeridad` como `— No evaluada (regla anterior bloqueante)` — visualiza directamente que las compuertas se evalúan igual pero una falla sí bloquea el resultado (ver invariante "las cuatro se evalúan siempre" en [[Motor de procedibilidad#`compuertas.ts` — Las cuatro reglas de procedibilidad]]).

El bloque de resultado sigue al pie de la letra [[Playbook de marca#6 · La decisión de diseño más importante]]: **"Este caso no va por tutela" / "Hay otro camino que le sirve más y es más rápido"**, en ámbar, con la ruta alterna (Queja ante Supersalud · Derecho de petición · Personería municipal) y nunca un rojo.

### 05 · Certificado de Auditoría

Implementación visual de `motor/certificado.ts` — [[Motor de procedibilidad#`certificado.ts` — Certificado de auditoría]]. Muestra:

- Metadatos: ID de sesión, fecha/hora, duración total, versión del motor (`v1.0.0-hackathon`, coincide con `MOTOR_VERSION` en el código).
- **Ruta de decisión** con timestamp por paso: transcripción (Whisper, confianza %), extracción de hechos (cuántos aceptados / rechazados por falta de origen — la garantía de `Memoria.agregar()`), cada compuerta con su veredicto, recuperación (sentencias recuperadas vs. candidatas evaluadas), redacción (modelo, tokens, temperatura).
- **Fuentes consultadas**, cada una marcada `Citada` o no, con su motivo si fue descartada — la regla de "nunca esconder una fuente caída" de [[Playbook de marca#7 · Aplicación en producto]].

---

## Cómo verlo

Es HTML autocontenido (Tailwind vía CDN + Google Fonts). Basta con abrirlo en el navegador:

```
open "05 Diseño UI/amparo-ui.html"
```

No es la app — es la referencia visual que el scaffold de Next.js (ver [[Stack y plan de ejecución#12 · Próximos pasos]]) debe implementar componente por componente, con los tokens reales en `@theme` en vez de clases arbitrarias sueltas de Tailwind.

## Pendientes que salen de revisar este mockup

- [ ] Decidir si "01 · Entrada de Voz" se queda oscura como portada o se lleva a `papel` para no romper la regla de marca
- [ ] Alinear el guion del video y la documentación de producto con el tercer interruptor real: ¿"Modo auditoría completa" (como está acá) o "Caso improcedente" (como dice el resto de la documentación)?
- [ ] Portar los 5 layouts a componentes reales de Next.js usando los tokens de [[Playbook de marca#10 · Tokens listos para pegar]] en vez de hex-codes sueltos en clases Tailwind
