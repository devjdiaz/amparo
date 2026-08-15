/**
 * Carga el corpus verificado a Supabase.
 *
 *   pnpm tsx scripts/cargar-corpus.ts
 *
 * `data/corpus.ts` es la fuente de verdad y vive versionada en el repo; la
 * base es una copia consultable. Es idempotente: se puede correr las veces
 * que haga falta.
 *
 * No carga nada que no haya pasado por verificar-corpus.ts. El orden importa.
 */

import { CORPUS } from '../data/corpus';
import { supabase } from '../src/lib/supabase';

async function main() {
  const db = supabase();

  const filas = CORPUS.map((s) => ({
    id: s.id,
    url: s.url,
    tema: s.tema,
    subregla: s.subregla,
    etiquetas: s.etiquetas,
    verificada_el: s.verificadaEl,
    embedding: null, // el recuperador en uso es determinístico; ver schema.sql
  }));

  const { error } = await db.from('sentencias').upsert(filas, { onConflict: 'id' });
  if (error) {
    console.error(`\n  ✗ ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const { data, error: err2 } = await db
    .from('sentencias')
    .select('id, verificada_el')
    .order('id');
  if (err2) {
    console.error(`\n  ✗ ${err2.message}\n`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n  ✓ ${data?.length ?? 0} sentencias en la base:\n`);
  for (const s of data ?? []) console.log(`      ${s.id.padEnd(11)} verificada ${s.verificada_el}`);
  console.log('');
}

main();
