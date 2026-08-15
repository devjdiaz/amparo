<p align="center">
  <img src="02 Marca/assets/amparo-lockup-horizontal.svg" alt="AMPARO" width="360">
</p>

<p align="center"><strong>Motor de decisión auditable para justicia rápida.</strong></p>

> Track 02 — Tecnología para la Justicia · Hac[k]athon CTW·2026

## El problema

- 312.500 tutelas de salud en 2025 (34% del total nacional)
- Tasa de concesión: 74,3%
- **Hallazgo crítico:** los departamentos con mayor pobreza tienen menor uso de tutelas
- Barrera: redacción (Art. 86 C.P. dice que NO requiere abogado)

## La solución

Voz → Tutela redactada con jurisprudencia verificable.

- **Sin alucinaciones:** la IA redacta, el código elige las citas
- **Auditable:** el certificado muestra fuentes consultadas y rechazadas
- **Integrada:** SUIN-Juriscol + normativa abierta + sentencias T- verificadas
- **Post-decisión:** seguimiento de trámites y pasos siguientes

## Arquitectura

```
Nota de voz
    ↓
Transcripción [Whisper]
    ↓
Hechos verificados (BD)
    ↓
Reglas de procedibilidad [CÓDIGO, no LLM]
    ├→ NO PROCEDE [ámbar + ruta alterna]
    └→ PROCEDE
        ↓
    Recuperación [SUIN-Juriscol + sentencias verificadas]
        ↓
    Redacción [LLM escribe A PARTIR de citas elegidas]
        ↓
    Certificado [auditoría completa]
        ↓
    PDF listo para radicar
```

> El modelo de lenguaje no puede alucinar una cita porque no es quien elige las citas.

## Los tres interruptores

1. **Apagar el recuperador** → deja de citar en vez de inventar.
2. **Apagar el LLM** → el veredicto de procedibilidad sale idéntico.
3. **Caso improcedente** → AMPARO se niega y enruta.

## Otros documentos soportados (v1+)

Derechos de petición · Quejas ante Superintendencias · Reclamaciones ante Defensoría

## Fuentes de datos integradas

SUIN-Juriscol · datos.gov.co · Relatoría Corte Constitucional · verificación de vigencia norma por norma

## Usuarios v1

Personerías municipales · Consultorios jurídicos universitarios · Juntas de Acción Comunal · Defensoría del Pueblo

## Estructura del repositorio

```
motor/          Motor de procedibilidad en TypeScript puro, con pruebas (Vitest)
02 Marca/assets/ Pack de logo: lockups, símbolo, mono, favicon, OG image
00 Inicio.md      Punto de entrada al vault de Obsidian con toda la documentación
```

Documentación completa del producto, la marca, la arquitectura técnica y la bitácora de decisiones: abrir esta carpeta como vault de Obsidian y empezar por `00 Inicio.md`.

## Licencia

MIT
