/**
 * Los casos de referencia, de punta a punta.
 *
 *   pnpm casos
 *
 * Corre al cerrar cada sesión de trabajo. Si uno deja de dar lo que debe, se
 * arregla antes de seguir. No levanta servidor, no toca la red y no invoca al
 * modelo: es el motor solo.
 *
 * No es solo una prueba — es el ensayo del demo. Lo que imprime acá es lo que
 * tiene que verse en pantalla, así que si el texto suena mal acá, suena mal
 * en el video.
 */

import { decidir } from '../src/lib/decidir';
import { CASOS } from '../src/fixtures/casos';
import { renderCertificado } from '../motor/certificado';
import { verificarHuella } from '../motor/huella';
import { fechaCorte } from '../src/lib/entorno';

const LINEA = '─'.repeat(78);
const HOY = fechaCorte();

let fallos = 0;

function chequear(descripcion: string, ok: boolean, observado: string) {
  if (!ok) fallos += 1;
  console.log(`  ${ok ? '✓' : '✗'}  ${descripcion.padEnd(52)} ${observado}`);
}

for (const caso of CASOS) {
  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: HOY });

  console.log(`\n${LINEA}`);
  console.log(`${caso.titulo}  ·  ${caso.id}  →  ${d.salida}`);
  console.log(LINEA);

  console.log(`\n  "${caso.transcripcion.slice(0, 150)}…"\n`);

  chequear(`Resultado ${caso.esperado}`, d.salida === caso.esperado, d.salida);
  chequear(
    'Las cuatro compuertas se evaluaron, sin corto circuito',
    d.procedibilidad.compuertas.length === 4,
    `${d.procedibilidad.compuertas.length} compuertas`,
  );
  chequear(
    'Todos los hechos tienen origen declarado',
    d.hechos.every((h) => h.origen.ref.trim() !== ''),
    `${d.hechos.length} hechos`,
  );

  // --- Compuertas
  console.log('\n  COMPUERTAS');
  for (const c of d.procedibilidad.compuertas) {
    const simbolo = { PASA: '✓', FALLA: '✕', INDETERMINADO: '?' }[c.veredicto];
    console.log(`    ${simbolo} ${c.regla.padEnd(16)} ${c.motivo}`);
    if (c.excepcion) console.log(`      excepción: ${c.excepcion}`);
    if (c.pregunta) console.log(`      falta: ${c.pregunta}`);
  }

  // --- Fuerza (nunca decide procedibilidad)
  if (d.fuerza) {
    console.log(`\n  FUERZA  ${d.fuerza.total}/100 → ${d.fuerza.postura}`);
    for (const f of d.fuerza.factores) {
      console.log(`    ${String(`${f.obtenido}/${f.maximo}`).padEnd(7)} ${f.etiqueta.padEnd(32)} ${f.motivo}`);
    }
  }

  // --- Recuperación
  if (d.recuperacion) {
    const r = d.recuperacion;
    console.log(`\n  JURISPRUDENCIA  ${r.citadas.length} citadas de ${r.evaluadas} evaluadas`);
    console.log(`    consulta: ${r.consulta}`);
    for (const c of r.citadas) {
      console.log(`    ▸ ${c.sentencia.id}  ${c.similitud.toFixed(3)}`);
      console.log(`      ${c.sentencia.url}`);
      console.log(`      ${c.explicacion}`);
    }
    for (const x of r.descartadas.slice(0, 3)) {
      console.log(`      ${x.id.padEnd(11)} descartada — ${x.motivo}`);
    }
  }

  // --- Rutas y preguntas: nunca un no seco, nunca una suposición
  if (d.salida === 'NO_PROCEDE') {
    chequear('Sale con ruta alterna', d.rutas.length > 0, `${d.rutas.length} rutas`);
    console.log('\n  LO QUE SÍ LE SIRVE HOY');
    for (const r of d.rutas) {
      console.log(`    → ${r.accion}${r.generable ? '  [se genera aquí]' : ''}`);
      console.log(`      ${r.comoSeHace}`);
      if (r.plazo) console.log(`      ${r.plazo}`);
    }
  }

  if (d.salida === 'FALTAN_DATOS') {
    chequear('Pregunta en vez de suponer', d.preguntas.length > 0, `${d.preguntas.length} preguntas`);
    console.log('\n  LO QUE FALTA PREGUNTAR');
    for (const p of d.preguntas) console.log(`    · ${p}`);
  }

  // --- Certificado: siempre, y verificable
  const huellaOk = verificarHuella(d.certificado);
  chequear('Certificado emitido y su huella verifica', huellaOk, `${d.certificado.huella.slice(0, 16)}…`);

  console.log('\n  RUTA DE DECISIÓN');
  for (const p of d.rutaDecision) {
    console.log(`    +${String(p.ms).padStart(4)}ms  ${p.paso.padEnd(22)} ${p.detalle}`);
  }

  if (d.corpusVencido.length) {
    console.log(`\n  ⚠ corpus sin verificar: ${d.corpusVencido.join(', ')}`);
  }
}

console.log(`\n${LINEA}`);
if (fallos === 0) {
  console.log(`Los ${CASOS.length} casos de referencia pasan.\n`);
} else {
  console.log(`${fallos} chequeo(s) fallando.\n`);
  process.exitCode = 1;
}

// El certificado completo del primer caso, para ver cómo se lee de verdad.
if (process.argv.includes('--certificado')) {
  const primero = CASOS[0];
  const d = decidir(primero.expediente, primero.hechos, { casoId: primero.id, hoy: HOY });
  console.log(renderCertificado(d.certificado));
  console.log('');
}
