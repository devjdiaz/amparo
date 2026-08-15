/**
 * Verificador del corpus.
 *
 *   pnpm tsx scripts/verificar-corpus.ts
 *
 * Corre antes de grabar y antes de entregar. Comprueba tres cosas:
 *
 *   1. Cada enlace responde. Un clic al vacío en el video destruye el
 *      argumento entero del proyecto.
 *   2. La cita textual aparece de verdad en la página. Es lo que impide que
 *      una subregla se desvíe de lo que la sentencia realmente dice — ya cazó
 *      una paráfrasis que se había colado como si fuera cita.
 *   3. Ninguna sentencia lleva más de 30 días sin verificar.
 *
 * Si algo falla, la sentencia se saca del corpus. No se negocia.
 */

import { CORPUS } from '../data/corpus';

const REEMPLAZO = String.fromCharCode(0xfffd);
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/**
 * Decodifica la página respetando su codificación real.
 *
 * Las páginas de la relatoría son HTML viejo en latin-1, y varias declaran
 * `charset=utf-8` en la cabecera igual. La cabecera miente, así que se
 * verifica el resultado: si aparecen muchos caracteres de reemplazo, la
 * decodificación fue la equivocada y se reintenta como windows-1252.
 *
 * Sin esto, cada tilde se convertía en basura y 'catastróficas' quedaba como
 * 'catastr ficas' — la búsqueda literal fallaba en sentencias correctas.
 */
function decodificar(bytes: ArrayBuffer, contentType: string | null): string {
  const con = (cs: string) => new TextDecoder(cs, { fatal: false }).decode(bytes);

  const declarado = /charset=([\w-]+)/i.exec(contentType ?? '')?.[1]?.toLowerCase();
  let texto = con(declarado ?? 'utf-8');

  const rotos = texto.split(REEMPLAZO).length - 1;
  if (rotos > 20) texto = con('windows-1252');

  return texto;
}

/**
 * Aplana para comparar. Las etiquetas se vuelven espacio porque el HTML de la
 * relatoría parte palabras a mitad de frase con <span> y <i>.
 */
function aplanar(texto: string): string {
  return texto
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;?/gi, ' ')
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

/** Fragmento buscable: las primeras N palabras de la cita, que es lo estable. */
function sonda(textual: string, palabras = 8): string {
  return aplanar(textual).split(' ').slice(0, palabras).join(' ');
}

async function main() {
  const hoy = new Date();
  let fallos = 0;

  console.log(`\nCorpus: ${CORPUS.length} sentencias\n${'─'.repeat(78)}`);

  for (const s of CORPUS) {
    const marcas: string[] = [];
    let cuerpo = '';

    // --- 1. el enlace responde
    try {
      const r = await fetch(s.url, {
        headers: { 'user-agent': 'AMPARO/1.0 (verificacion de corpus)' },
        signal: AbortSignal.timeout(25_000),
      });
      if (!r.ok) {
        marcas.push(`✗ HTTP ${r.status}`);
        fallos += 1;
      } else {
        marcas.push(`✓ HTTP ${r.status}`);
        cuerpo = aplanar(decodificar(await r.arrayBuffer(), r.headers.get('content-type')));
      }
    } catch (e) {
      marcas.push(`✗ sin respuesta (${e instanceof Error ? e.message : String(e)})`);
      fallos += 1;
    }

    // --- 2. la cita textual está en la página
    if (cuerpo) {
      const buscada = sonda(s.textual);
      if (cuerpo.includes(buscada)) {
        marcas.push('✓ cita textual encontrada');
      } else {
        marcas.push(`✗ CITA NO ENCONTRADA — "${buscada}…"`);
        fallos += 1;
      }
    }

    // --- 3. antigüedad de la verificación
    const dias = Math.floor(
      (hoy.getTime() - new Date(`${s.verificadaEl}T00:00:00Z`).getTime()) / 86_400_000,
    );
    marcas.push(dias > 30 ? `✗ verificada hace ${dias} días` : `✓ verificada hace ${dias} d`);
    if (dias > 30) fallos += 1;

    console.log(`\n  ${s.id.padEnd(11)} ${s.tema}`);
    console.log(`  ${' '.repeat(11)} ${s.url}`);
    for (const m of marcas) console.log(`  ${' '.repeat(11)} ${m}`);
  }

  console.log(`\n${'─'.repeat(78)}`);
  if (fallos === 0) {
    console.log(`Las ${CORPUS.length} sentencias verifican.\n`);
  } else {
    console.log(`${fallos} verificación(es) fallando. Sacar del corpus lo que no pase.\n`);
    process.exitCode = 1;
  }
}

main();
