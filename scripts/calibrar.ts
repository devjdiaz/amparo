/**
 * Calibrador del recuperador.
 *
 *   pnpm tsx scripts/calibrar.ts
 *
 * Imprime, para cada consulta de referencia, cómo ordena el corpus REAL y con
 * qué puntaje. Es lo que permite fijar UMBRAL_SIMILITUD con datos en vez de a
 * ojo — un umbral mal puesto rompe el interruptor 1 sin que nadie se entere:
 * el sistema deja de citar (o cita de más) y el demo no demuestra nada.
 *
 * Se vuelve a correr cada vez que entra o sale una sentencia del corpus.
 */

import { CORPUS } from '../data/corpus';
import { Indice, explicarPuntaje } from '../motor/similitud';
import { UMBRAL_SIMILITUD } from '../motor/recuperador';

/**
 * Consultas de referencia. Se arman como lo hace construirConsulta():
 * servicio · tipo de negación · sujeto de especial protección · énfasis.
 *
 * `debeCitar` es la expectativa humana: qué sentencias TIENEN que salir. Es
 * lo que convierte esto en una calibración y no en una impresión de números.
 */
const CONSULTAS: { nombre: string; consulta: string; debeCitar: string[] }[] = [
  {
    nombre: 'caso 1 · cita con especialista',
    consulta:
      'cita con especialista en neurología · no asignación · adulto mayor 71 años · vida digna · perjuicio irremediable · orden del médico tratante',
    // Solo la específica. T-252/24 es marco general y puntúa 0.207: el
    // recuperador prefiere una cita exacta a dos vagas, y las descartadas
    // viajan igual en el certificado con su motivo.
    debeCitar: ['T-377/24'],
  },
  {
    nombre: 'caso 2 · medicamento',
    consulta:
      'entrega de medicamento oncológico · no entrega · enfermedad catastrófica · vida digna · orden del médico tratante',
    debeCitar: ['T-380/24'],
  },
  {
    nombre: 'caso 3 · improcedente (aún no pidió a la EPS)',
    consulta:
      'cita de control con medicina general · no asignación · acceso efectivo al servicio de salud',
    debeCitar: [],
  },
  {
    nombre: 'fuera de dominio · pensión',
    consulta: 'reconocimiento de pensión de vejez · negación · mínimo vital',
    debeCitar: [],
  },
];

const indice = new Indice(CORPUS);
const ancho = Math.max(...CORPUS.map((c) => c.id.length));

console.log(`\nCorpus: ${indice.tamano} sentencias · umbral actual ${UMBRAL_SIMILITUD}`);
console.log('─'.repeat(78));

let problemas = 0;

for (const { nombre, consulta, debeCitar } of CONSULTAS) {
  console.log(`\n${nombre}`);
  console.log(`  "${consulta.slice(0, 86)}${consulta.length > 86 ? '…' : ''}"`);

  const resultados = indice.buscar(consulta);
  const citadas: string[] = [];

  for (const { sentencia, puntaje } of resultados) {
    if (puntaje.similitud === 0) continue;
    const pasa = puntaje.similitud >= UMBRAL_SIMILITUD;
    if (pasa) citadas.push(sentencia.id);
    const barra = '█'.repeat(Math.round(puntaje.similitud * 30));
    console.log(
      `    ${pasa ? '▸' : ' '} ${sentencia.id.padEnd(ancho)}  ${puntaje.similitud.toFixed(3)}  ${barra}`,
    );
    console.log(`      ${' '.repeat(ancho)}  └ ${explicarPuntaje(puntaje)}`);
  }
  if (citadas.length === 0) console.log('      (ninguna supera el umbral — no se cita)');

  const faltantes = debeCitar.filter((id) => !citadas.includes(id));
  const sobrantes = citadas.filter((id) => !debeCitar.includes(id));
  if (faltantes.length) {
    console.log(`  ✗ FALTAN: ${faltantes.join(', ')}`);
    problemas += 1;
  }
  if (sobrantes.length) {
    console.log(`  ! de más: ${sobrantes.join(', ')}`);
  }
  if (!faltantes.length && !sobrantes.length) console.log('  ✓ cita exactamente lo esperado');
}

console.log(`\n${'─'.repeat(78)}`);
console.log(
  problemas === 0
    ? `El umbral ${UMBRAL_SIMILITUD} deja pasar lo que debe.\n`
    : `${problemas} consulta(s) no citan lo esperado. Ajustar UMBRAL_SIMILITUD o las etiquetas.\n`,
);
