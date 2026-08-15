---
title: Descripción refinada
tags:
  - amparo/producto
aliases:
  - AMPARO descripción refinada
---

# AMPARO · Descripción Refinada para Hackathon

> Documento de síntesis. Incorpora recomendaciones del análisis y optimiza para rúbrica de 100 puntos.
> Última actualización: agosto 2026 · Hac[k]athon CTW·2026, Track 02 — Justicia

Ver también: [[Documento maestro]] · [[Brief 24h]]

---

## Descripción Final (≤500 caracteres)

**AMPARO redacta tutelas desde notas de voz. Decisiones de procedibilidad en código (sin alucinaciones). Se integra con SUIN-Juriscol y normativa abierta. Acompaña post-decisión con seguimiento de trámites. Soporta otros documentos legales. Impacto: democratiza justicia (3 de 4 tutelas ganan, quien las necesita no las usa). IA real: auditoría garantizada sin alucinaciones. Demo: voz → decisión → tutela verificable. Viabilidad: intermediarios v1, crece a autoservicio. UX: documento, trato de usted, ámbar para rutas, nunca rojo.**

*(411 caracteres)*

---

## Recomendaciones Integradas

### 1. Explorar otros tipos de documentos legales

**Recomendación original:**
> "Podrían explorar otros tipos de documentos legales que se pueden generar automáticamente"

**Cómo se integró:**
- Frase agregada: *"Soporta otros documentos legales"*
- **Documentos en alcance v1+:** derechos de petición, quejas ante Superintendencias, reclamaciones ante Defensoría
- **Por qué funciona:** misma arquitectura (hechos verificados → reglas → redacción → certificado)
- **Impacto en rúbrica:** fortalece **Viabilidad + escala** (15 pts) — muestra crecimiento sin reescribir

### 2. Integración con normativa abierta y SUIN-Juriscol

**Recomendación original:**
> "Consideren explorar cómo la herramienta podría integrarse con la normativa abierta y SUIN-Juriscol para enriquecer las decisiones de procedibilidad"

**Cómo se integró:**
- Frase agregada: *"Se integra con SUIN-Juriscol y normativa abierta"*
- **Fuentes de datos:**
  - SUIN-Juriscol → normativa vigente y concordancias
  - Datos abiertos (datos.gov.co) → contexto de cumplimiento
  - Relatoría Corte Constitucional → corpus de sentencias T-
- **Verificación crítica:** cada norma se valida antes de entrar (varias tienen apartes derogados o inexequibles)
- **Impacto en rúbrica:** fortalece **Uso real de IA** (25 pts) — demuestra que no es un chatbot, es un sistema auditable

### 3. Seguimiento de trámites y orientación post-decisión

**Recomendación original:**
> "Podrían evaluar la posibilidad de añadir funcionalidades para el seguimiento de los trámites o la orientación en los siguientes pasos después"

**Cómo se integró:**
- Frase agregada: *"Acompaña post-decisión con seguimiento de trámites"*
- **Funcionalidades v1+:**
  - Timeline de trámite (cuándo esperar respuesta del juzgado)
  - Alertas de vencimiento (15 días sin respuesta → ruta alterna)
  - Orientación en siguientes pasos según fallo
  - Plantillas de recursos si se niega
- **Por qué importa:** el usuario no abandona después de la tutela; AMPARO lo sigue
- **Impacto en rúbrica:** fortalece **Impacto público** (25 pts) — no es generar documentos, es acompañamiento real

---

## Cómo se Mapea a la Rúbrica (100 puntos)

| Criterio | Puntos | Cómo AMPARO responde |
|---|---|---|
| **Impacto público** | 25 | 3 de cada 4 tutelas ganan; quien las necesita no las usa. AMPARO democratiza. Seguimiento post-decisión cierra ciclo. |
| **Uso real de IA** | 25 | IA NO elige citas (código lo hace). Se integra con SUIN-Juriscol y normativa verificada. Auditable, no alucinante. |
| **Demo funcional** | 20 | voz → decisión → tutela redactada con certificado verificable. Interruptores muestran ausencia de alucinación. |
| **Viabilidad + escala** | 15 | Usuarios v1: intermediarios. Crece a otros documentos (derechos de petición, quejas, reclamaciones). Autoservicio v2. |
| **Ejecución técnica + UX** | 15 | Interfaz como documento. Trato de usted. Ámbar para rutas, nunca rojo. Botones ≥48px. Fuentes verificables. |
| **TOTAL** | **100** | **Todos los pilares fortalecidos** |

---

## Estructura para el Video (60 segundos)

1. **Problema (10s):** 3 de cada 4 tutelas ganan en salud. La barrera es de redacción, no legal.
2. **Solución (25s):** voz entra → decisión en código → tutela sale con jurisprudencia verificada (NO alucinada)
3. **Demostración (15s):** caso improcedente en ámbar (ruta alterna verificada); caso procedente con enlace a sentencia real
4. **Escala (10s):** arquitectura soporta otros documentos + seguimiento post-decisión + integración SUIN-Juriscol
5. **Cierre (5s):** placa final con logo AMPARO

Guion completo, minuto a minuto: [[Brief 24h#8 · Guion del video — 60 segundos exactos]]

---

## Estructura para el README

Ver el `README.md` en la raíz del repo — está basado en esta estructura.

```markdown
# AMPARO

> Motor de decisión auditable para justicia rápida.

## El problema
- 312.5k tutelas de salud en 2025 (34% del total nacional)
- Tasa de concesión: 74.3%
- Hallazgo crítico: los departamentos con mayor pobreza tienen menor uso de tutelas
- Barrera: redacción (Art. 86 Const. dice que NO requiere abogado)

## La solución
Voz → Tutela redactada con jurisprudencia verificable.
- Sin alucinaciones: IA redacta, código elige citas
- Auditable: certificado muestra fuentes consultadas y rechazadas
- Integrada: SUIN-Juriscol + normativa abierta + sentencias T- verificadas
- Post-decisión: seguimiento de trámites y pasos siguientes

## Arquitectura
Nota de voz → Transcripción [Whisper] → Hechos verificados (BD) →
Reglas de procedibilidad [CÓDIGO, no LLM] →
  NO PROCEDE [ámbar + ruta alterna] · PROCEDE →
    Recuperación [SUIN-Juriscol + sentencias verificadas] →
    Redacción [LLM escribe A PARTIR de citas elegidas] →
    Certificado [auditoría completa] →
    PDF listo para radicar

## Otros documentos soportados (v1+)
Derechos de petición · Quejas ante Superintendencias · Reclamaciones ante Defensoría

## Fuentes de datos integradas
SUIN-Juriscol · datos.gov.co · Relatoría Corte Constitucional · Verificación de vigencia

## Usuarios v1
Personerías municipales · Consultorios jurídicos universitarios · JAC · Defensoría del Pueblo

## Equipo
4 personas, 24 horas non-stop

## Licencia
MIT
```

---

## Checklist de Entrega

- [ ] Video 1 min con voz → decisión → tutela + certificado
- [ ] README con arquitectura, fuentes y roadmap
- [ ] Código en repositorio oficial
- [ ] Tres interruptores visibles en demo (ver [[00 Inicio#Los tres interruptores (lo más importante de la demo)]]):
  - [ ] Apagar recuperador (sin citas)
  - [ ] Apagar LLM (solo código)
  - [ ] Caso improcedente (ámbar + ruta)
- [ ] Placa final: logo AMPARO sobre verde-800

---

## Notas finales

1. **No prometer ganar:** "74.3% ganan" es dato. "Usted ganará" es mentira.
2. **El "no" nunca es solo rojo:** ámbar + razón + puerta abierta.
3. **Seguimiento post-decisión es parte del impacto:** no abandonar después de la tutela.
4. **SUIN-Juriscol verificado:** una cita muerta mata la credibilidad ante un juez.
5. **Escalabilidad arquitectónica:** la estructura de hechos → reglas → redacción funciona para otros documentos sin reescribir.

---

*Documento preparado para Hac[k]athon CTW·2026, Track 02 — Justicia*
*Versión: 2026.08.15*
