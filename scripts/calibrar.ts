/**
 * Calibrador del recuperador.
 *
 *   pnpm tsx scripts/calibrar.ts
 *
 * Fija UMBRAL_SIMILITUD con datos en vez de a ojo. Un umbral mal puesto rompe
 * el interruptor 1 sin que nadie se entere: el sistema deja de citar, o cita
 * de más, y el demo no demuestra nada.
 *
 * ---------------------------------------------------------------------------
 * IMPORTANTE: las consultas salen de construirConsulta() sobre los expedientes
 * reales, NO de consultas escritas a mano.
 *
 * La primera versión de este script las escribía a mano y quedaron parecidas
 * pero no iguales a las que el sistema produce — les faltaban los términos de
 * énfasis que agrega la fuerza del caso. El umbral quedó calibrado 0.06 arriba
 * de donde debía y el motor terminó citando cero sentencias en los dos casos
 * que sí deben citar. Calibrar contra una consulta aproximada es no calibrar.
 * ---------------------------------------------------------------------------
 */

import { CORPUS } from '../data/corpus';
import { Indice, explicarPuntaje } from '../motor/similitud';
import { construirConsulta, UMBRAL_SIMILITUD } from '../motor/recuperador';
import { calcularFuerza } from '../motor/fuerza';
import { evaluarProcedibilidad } from '../motor/compuertas';
import { CASOS } from '../src/fixtures/casos';
import { fechaCorte } from '../src/lib/entorno';

const indice = new Indice(CORPUS);
const ancho = Math.max(...CORPUS.map((c) => c.id.length));
const HOY = fechaCorte();

/** Qué TIENE que citar cada caso. Es la expectativa humana, no un adorno. */
const ESPERADO: Record<string, string[]> = {
  'cita-especialista': ['T-377/24'],
  medicamento: ['T-380/24'],
  improcedente: [], // no llega a recuperar: las compuertas ya resolvieron
  'faltan-datos': [],
};

console.log(`\nCorpus: ${indice.tamano} sentencias · umbral actual ${UMBRAL_SIMILITUD}`);
console.log('─'.repeat(78));

const techoDeLoQueNoDebe: number[] = [];
const pisoDeLoQueSiDebe: number[] = [];
let problemas = 0;

for (const caso of CASOS) {
  const proc = evaluarProcedibilidad(caso.expediente, HOY);
  const debe = ESPERADO[caso.id] ?? [];

  console.log(`\n${caso.id}  (${proc.salida})`);

  if (proc.salida !== 'PROCEDE') {
    console.log('  no llega al recuperador — las compuertas ya resolvieron');
    if (debe.length) {
      console.log(`  ✗ pero se esperaba que citara ${debe.join(', ')}`);
      problemas += 1;
    } else {
      console.log('  ✓ correcto: no se consulta jurisprudencia');
    }
    continue;
  }

  // La consulta REAL, la que el sistema arma de verdad.
  const consulta = construirConsulta(caso.expediente, calcularFuerza(caso.expediente));
  console.log(`  "${consulta}"`);

  const citadas: string[] = [];
  for (const { sentencia, puntaje } of indice.buscar(consulta)) {
    if (puntaje.similitud === 0) continue;
    const pasa = puntaje.similitud >= UMBRAL_SIMILITUD;
    if (pasa) citadas.push(sentencia.id);

    (debe.includes(sentencia.id) ? pisoDeLoQueSiDebe : techoDeLoQueNoDebe).push(
      puntaje.similitud,
    );

    const barra = '█'.repeat(Math.round(puntaje.similitud * 30));
    console.log(
      `    ${pasa ? '▸' : ' '} ${sentencia.id.padEnd(ancho)} ${puntaje.similitud.toFixed(3)} ${barra}`,
    );
    console.log(`      ${' '.repeat(ancho)} └ ${explicarPuntaje(puntaje)}`);
  }

  const faltantes = debe.filter((id) => !citadas.includes(id));
  const sobrantes = citadas.filter((id) => !debe.includes(id));
  if (faltantes.length) {
    console.log(`  ✗ FALTAN: ${faltantes.join(', ')}`);
    problemas += 1;
  }
  if (sobrantes.length) {
    console.log(`  ✗ DE MÁS: ${sobrantes.join(', ')}`);
    problemas += 1;
  }
  if (!faltantes.length && !sobrantes.length) console.log('  ✓ cita exactamente lo esperado');
}

// ---------------------------------------------------------------------------
// Recomendación de umbral, calculada de los puntajes reales
// ---------------------------------------------------------------------------
console.log(`\n${'─'.repeat(78)}`);

const piso = pisoDeLoQueSiDebe.length ? Math.min(...pisoDeLoQueSiDebe) : NaN;
const techo = techoDeLoQueNoDebe.length ? Math.max(...techoDeLoQueNoDebe) : NaN;

console.log(`  lo más flojo que SÍ debe citar : ${isNaN(piso) ? '—' : piso.toFixed(3)}`);
console.log(`  lo más alto que NO debe citar  : ${isNaN(techo) ? '—' : techo.toFixed(3)}`);

if (!isNaN(piso) && !isNaN(techo)) {
  if (techo >= piso) {
    console.log('\n  ✗ NO HAY UMBRAL POSIBLE: se solapan. Hay que arreglar etiquetas,');
    console.log('    no el umbral. Una sentencia que no aplica está puntuando como si aplicara.');
  } else {
    const sugerido = Math.round(((piso + techo) / 2) * 100) / 100;
    console.log(`\n  umbral sugerido (punto medio): ${sugerido.toFixed(2)}`);
    console.log(`  margen a cada lado: ${((piso - techo) / 2).toFixed(3)}`);
  }
}

console.log(
  problemas === 0
    ? `\n  El umbral ${UMBRAL_SIMILITUD} deja pasar lo que debe.\n`
    : `\n  ${problemas} problema(s). Ajustar UMBRAL_SIMILITUD o las etiquetas del corpus.\n`,
);
if (problemas > 0) process.exitCode = 1;
