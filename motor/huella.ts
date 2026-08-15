/**
 * AMPARO · Huella del certificado.
 *
 * Un certificado impreso no sirve de nada si no se puede comprobar que nadie
 * lo tocó después. La huella es un SHA-256 sobre el contenido serializado de
 * forma canónica: las llaves van ordenadas alfabéticamente en todo el árbol,
 * así que el mismo certificado produce siempre el mismo hash sin importar en
 * qué orden se armó el objeto.
 *
 * Lo que NO es, y conviene decirlo en voz alta: no es una firma criptográfica.
 * No hay clave privada de por medio y no pretende haberla. Prueba integridad,
 * no autoría.
 */

import { createHash } from 'node:crypto';

/** JSON canónico: llaves ordenadas recursivamente, para que la huella sea estable. */
export function canonico(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor instanceof Date) return valor.toISOString();
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonico(v)]),
    );
  }
  return valor;
}

export function huellaDe(contenido: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonico(contenido))).digest('hex');
}

/** Verifica que un objeto con campo `huella` no fue alterado después de emitirse. */
export function verificarHuella<T extends { huella: string }>(sellado: T): boolean {
  const { huella, ...cuerpo } = sellado;
  return huellaDe(cuerpo) === huella;
}

/**
 * Hash corto de las reglas del motor. Va en el certificado para que dos
 * decisiones tomadas con reglas distintas no se puedan confundir.
 */
export function hashDeReglas(reglas: Record<string, unknown>): string {
  return huellaDe(reglas).slice(0, 12);
}
