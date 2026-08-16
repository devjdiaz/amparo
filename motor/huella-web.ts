/**
 * AMPARO · La misma huella, calculada en el navegador.
 *
 * `huella.ts` usa node:crypto y corre en el servidor. Esta versión usa Web
 * Crypto y corre en el cliente, sobre EXACTAMENTE el mismo JSON canónico.
 *
 * Por qué existe: para que el certificado no diga "confiá en que esta huella
 * está bien". Quien lo mire puede pedirle al navegador que la recalcule ahí
 * mismo, delante suyo, y comparar. Un sello que solo el emisor puede
 * verificar no es un sello, es una etiqueta.
 *
 * Si las dos implementaciones dieran distinto, el certificado sería inútil —
 * por eso `canonico()` está en un solo lugar y las dos lo importan.
 */

import { canonico } from './huella';

export async function huellaWebDe(contenido: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(canonico(contenido)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Recalcula la huella de un certificado y la compara con la que trae. */
export async function verificarHuellaWeb<T extends { huella: string }>(
  sellado: T,
): Promise<{ ok: boolean; recalculada: string }> {
  const { huella, ...cuerpo } = sellado;
  const recalculada = await huellaWebDe(cuerpo);
  return { ok: recalculada === huella, recalculada };
}
