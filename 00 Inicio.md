---
title: AMPARO — Inicio
tags:
  - amparo/moc
aliases:
  - Inicio
  - Home
---

# AMPARO

> Motor de decisión auditable aplicado a la acción de tutela.
> Entra una nota de voz. Sale una tutela lista para radicar — o un no, con razones y con ruta.

Hac[k]athon CTW·2026 · Track 02 — Justicia · Sábado 15 ago 10:00 → Domingo 16 ago 09:00 (23 horas)

Este vault documenta el proyecto completo — producto, marca, arquitectura técnica y bitácora de decisiones — y vive en la misma carpeta que el código (carpeta `motor/`), porque esta carpeta **es** el repositorio.

---

## La tesis en una frase

> El modelo de lenguaje no puede alucinar una cita porque no es quien elige las citas.

## Mapa del vault

### 📦 Producto
- [[Descripción refinada]] — la síntesis de 500 caracteres, mapeo a la rúbrica de 100 puntos, checklist de entrega
- [[Documento maestro]] — documento de referencia completo: producto, arquitectura, marca, voz, registro de decisiones
- [[Brief 24h]] — arquitectura detallada, alcance de las 23 horas, guion del video de 60s
- [[Idea original]] — el primer brief, previo a calibrar a 23 horas (pensado para equipo de 4, WhatsApp)

### 🎨 Marca
- [[Playbook de marca]] — paleta, tipografía, logo, voz y microcopy, tokens CSS
- Assets del logo en [[02 Marca/assets/README|02 Marca/assets]] (SVG, PNG, favicon)

### ⚙️ Técnico
- [[Stack y plan de ejecución]] — stack definitivo, Supabase, variables de entorno, plan hora por hora, cortes de emergencia
- [[Motor de procedibilidad]] — qué hace el código en `motor/` y cómo se relaciona con la arquitectura

### 🖥️ Diseño UI
- [[Diseño UI]] — mockup exportado de Pencil con las 5 pantallas del producto (`05 Diseño UI/amparo-ui.html`)

### 📓 Bitácora
- [[Bitácora hackathon CTW·2026]] — qué se evaluó, qué se descartó y por qué; notas regulatorias de Publimercar; aprendizajes transferibles

### 🗝️ Arsenal — GarantÍA
> El motor de decisión auditable que ya ganó el hackathon de Colsubsidio, desarmado para AMPARO. **No sale del vault** (ver `.gitignore`).

- [[GarantIA]] — qué es, cómo levantarlo, mapa del repo (`06 Arsenal/GarantIA/`)
- [[Patrones GarantIA]] — las 12 decisiones de arquitectura, con su estado de portabilidad a AMPARO
- [[Arsenal de código]] — qué archivo se copia tal cual, cuál se adapta, cuál no sirve
- [[Jugadas de demo]] — el interruptor, el rechazo, el fallo declarado en vivo, el README como pitch

---

## Los tres interruptores (lo más importante de la demo)

1. **Apagar el recuperador** → deja de citar en vez de inventar. *No alucinamos.*
2. **Apagar el LLM** → el veredicto de procedibilidad sale idéntico. *La decisión nunca dependió del modelo.*
3. **Caso improcedente** → AMPARO se niega y enruta. *Tenemos criterio, no solo generación.*

## Estado y pendientes

> [!todo] Pendientes activos
> - [ ] Decidir el nombre final: `AMPARO` a secas o conservar la IA (recomendación: quitarla)
> - [ ] Definir los pesos numéricos de las cuatro reglas de procedibilidad
> - [ ] Armar el corpus de 25–30 sentencias T- de salud
> - [ ] Verificar vigencia de cada norma antes de meterla al corpus
> - [ ] Scaffold Next.js + deploy vacío a Vercel (hora 2, ver [[Stack y plan de ejecución#9 · Plan hora por hora]])

> [!danger] Huecos que salieron de revisar el arsenal
> Ordenados por costo de no hacerlos. Detalle en [[Patrones GarantIA]].
> - [ ] **Camino determinístico del redactor.** Sin él no hay interruptor 2 y una caída de red mata la demo — [[Patrones GarantIA#3 · El fallback determinístico es el camino por defecto|patrón 3]]
> - [ ] **Precachear los 3 casos de referencia** y servirlos con `MODO_DEMO=true` (default en `true`)
> - [ ] **Bloque final de congelar y ensayar** en el plan hora por hora — GarantÍA le reservó uno entero
> - [ ] Huella SHA-256 canónica en `certificado.ts` — 18 líneas, copiar de [[Arsenal de código]]
> - [ ] Cuarto caso de referencia: hechos insuficientes → AMPARO devuelve **la pregunta**, no un veredicto ([[Jugadas de demo]], jugada 4)
> - [ ] Consolidar todos los umbrales en `motor/reglas.ts`, cada uno con su fundamento normativo

## Documentos relacionados fuera del vault

| Ruta | Contenido |
|---|---|
| `motor/` | Motor de procedibilidad en TypeScript puro, con pruebas (Vitest) |
| `02 Marca/assets/` | Pack de logo: lockups, símbolo, mono, favicon, OG image |
| `05 Diseño UI/amparo-ui.html` | Mockup de las 5 pantallas exportado de Pencil, ver [[Diseño UI]] |
| `README.md` | README de cara al repositorio de GitHub (el pitch, ver [[Descripción refinada]]) |
| `06 Arsenal/GarantIA/` | Repositorio completo de GarantÍA — referencia, no se publica. Ver [[GarantIA]] |
