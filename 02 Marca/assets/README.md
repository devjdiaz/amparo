---
title: Pack de logo — assets
tags:
  - amparo/marca
aliases:
  - AMPARO pack de logo
---

# AMPARO · Pack de logo

Todos los SVG traen el **texto trazado a curvas**. No dependen de fuentes instaladas y se ven igual en cualquier máquina, navegador o servidor. Ninguno lleva fondo propio: son transparentes.

Contexto de diseño y reglas de construcción del logo: [[Playbook de marca#4 · Logo]].

## Archivos

| Archivo | Cuándo se usa |
|---|---|
| `amparo-lockup.svg` | Marca completa con bajada. Portadas, placa final del video, slides. |
| `amparo-lockup-simple.svg` | Igual sin bajada. Cuando el espacio es corto o la bajada ya está en el texto. |
| `amparo-lockup-horizontal.svg` | **Encabezado del README y del sitio.** Es el que más van a usar. |
| `amparo-lockup-invertido.svg` | Sobre `#0A3B2E` u otros fondos oscuros. |
| `amparo-simbolo.svg` | Símbolo solo. Avatar, sello, marca de agua del PDF. |
| `amparo-simbolo-mono.svg` | Un solo color. Impresión, fax, sellos, documentos en blanco y negro. |
| `amparo-favicon.svg` | **Variante densa.** Trazo grueso y persona más grande, para 16–48px. |
| `favicon.ico` | Multi-resolución, 16 a 256. Va en la raíz del sitio. |
| `amparo-simbolo-512.png` · `-180.png` | Avatares de GitHub, Discord, apple-touch-icon. |
| `amparo-og.png` | 1200×630 para compartir el repo. Símbolo y marca en papel sobre verde. |
| `amparo-lockup.png` | 1120×1000 sobre papel, para pegar en slides. |
| `amparo-logo-v2.svg` | Logo corregido (post errores v1), listo para trazar. |

## Por qué hay dos versiones del símbolo

El símbolo normal usa trazo de 34 y la persona a escala natural. Debajo de 24px las patas del techo se afinan y la persona se pierde.

`amparo-favicon.svg` tiene el trazo a 46 y la persona más grande y más alta. Se ve tosco a tamaño grande y perfecto a tamaño chico. **Nunca lo usen por encima de 64px**, ni el normal por debajo de 24px.

## Reglas

| | |
|---|---|
| Área de protección | Igual a la altura de la A por los cuatro lados |
| Tamaño mínimo | 24px el lockup · 16px el símbolo (usando la variante favicon) |
| Ángulo del vértice | 55°. Está fijo en los archivos, no lo modifiquen |
| Nunca | Degradados, sombras, contornos, rotarlo, meterlo en círculo, cambiar la proporción, ponerlo sobre foto sin caja sólida |

## Colores usados

```
#0A3B2E   verde-800   techo, cuerpo, wordmark
#0D5643   verde-700   bajada
#C97A22   ambar-500   la persona
#A8DBC8   verde-200   bajada sobre fondo oscuro
#FBF9F4   papel       versión invertida
```

La persona es el único elemento en ámbar de toda la marca. Es deliberado: el color cálido es la persona protegida, y ese acento es lo que separa a AMPARO de cualquier logo institucional verde.

## Si cambia el nombre

Estos archivos dicen `AMPARO`. Si el equipo decide conservar la IA en la marca, hay que regenerarlos: el texto está trazado y no se puede editar con un buscar-y-reemplazar. Ver pendiente en [[00 Inicio#Estado y pendientes]].
