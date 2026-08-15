/**
 * AMPARO · Certificado de auditoría.
 *
 * Se emite SIEMPRE, incluso cuando el caso no procede y cuando faltan datos.
 * Un certificado que solo aparece en el éxito no es auditoría, es marketing.
 *
 * Regla portada de GarantÍA: una fuente caída se declara, nunca se esconde.
 */

import { Procedibilidad } from './compuertas';
import { Fuerza } from './fuerza';
import { huellaDe } from './huella';
import { Recuperacion } from './recuperador';
import { Validacion } from './validador';

export interface Certificado {
  casoId: string;
  emitidoEl: string;
  motorVersion: string;
  reglasHash: string;
  corpusVersion: string;
  procedibilidad: Procedibilidad;
  fuerza: Fuerza | null;          // null cuando no procede o faltan datos
  recuperacion: Recuperacion | null;
  validacion: Validacion | null;
  interruptores: Interruptores;
  /** SHA-256 canónico sobre todo lo anterior. Prueba integridad, no autoría. */
  huella: string;
}

/** Estado de los tres controles de la demo. Va en el certificado a propósito. */
export interface Interruptores {
  recuperadorActivo: boolean;
  llmActivo: boolean;
}

export const MOTOR_VERSION = '1.0.0';

export interface EntradaCertificado {
  casoId: string;
  reglasHash: string;
  corpusVersion: string;
  procedibilidad: Procedibilidad;
  fuerza?: Fuerza | null;
  recuperacion?: Recuperacion | null;
  validacion?: Validacion | null;
  interruptores?: Partial<Interruptores>;
  ahora?: Date;
}

export function emitirCertificado(e: EntradaCertificado): Certificado {
  const cuerpo = {
    casoId: e.casoId,
    emitidoEl: (e.ahora ?? new Date()).toISOString(),
    motorVersion: MOTOR_VERSION,
    reglasHash: e.reglasHash,
    corpusVersion: e.corpusVersion,
    procedibilidad: e.procedibilidad,
    fuerza: e.fuerza ?? null,
    recuperacion: e.recuperacion ?? null,
    validacion: e.validacion ?? null,
    interruptores: {
      recuperadorActivo: e.interruptores?.recuperadorActivo ?? true,
      llmActivo: e.interruptores?.llmActivo ?? true,
    },
  };

  return { ...cuerpo, huella: huellaDe(cuerpo) };
}

const SIMBOLO = { PASA: '✓', FALLA: '✕', INDETERMINADO: '?' } as const;

/** Render en monoespaciado. Va tal cual a pantalla y al PDF. */
export function renderCertificado(c: Certificado): string {
  const L: string[] = [];
  const pad = (s: string, n: number) => s.padEnd(n, ' ');

  L.push(`CERTIFICADO DE DECISIÓN · caso ${c.casoId}`);
  L.push(`motor ${c.motorVersion} · reglas ${c.reglasHash} · corpus ${c.corpusVersion}`);
  L.push(`emitido ${c.emitidoEl}`);
  L.push('');

  L.push(`SALIDA  ${c.procedibilidad.salida}`);
  L.push('');
  L.push('COMPUERTAS');
  for (const g of c.procedibilidad.compuertas) {
    L.push(`  ${SIMBOLO[g.veredicto]} ${pad(g.regla, 16)} ${g.motivo}`);
    L.push(`      ${g.fundamento}`);
    if (g.hechos.length) L.push(`      hechos: ${g.hechos.join(', ')}`);
    if (g.excepcion) L.push(`      excepción: ${g.excepcion}`);
    if (g.pregunta) L.push(`      falta: ${g.pregunta}`);
  }

  if (c.procedibilidad.rutas.length) {
    L.push('');
    L.push('LO QUE SÍ LE SIRVE HOY');
    for (const r of c.procedibilidad.rutas) {
      L.push(`  → ${r.accion}${r.generable ? '  [se genera aquí]' : ''}`);
      L.push(`    ${r.comoSeHace}`);
      if (r.plazo) L.push(`    ${r.plazo}`);
    }
  }

  if (c.fuerza) {
    L.push('');
    L.push(`FUERZA DEL CASO  ${c.fuerza.total}/100 → ${c.fuerza.postura}`);
    L.push('  (la fuerza no decide procedibilidad; solo qué se pide y qué se cita)');
    for (const f of c.fuerza.factores) {
      L.push(`  ${pad(`${f.obtenido}/${f.maximo}`, 7)} ${pad(f.etiqueta, 30)} ${f.motivo}`);
    }
  }

  if (c.recuperacion) {
    const r = c.recuperacion;
    L.push('');
    L.push('FUENTES');
    L.push(`  consulta      ${r.consulta}`);
    L.push(`  consultadas   ${r.fuentesConsultadas.join(' · ')}`);
    L.push(
      `  citadas       ${
        r.citadas.length
          ? r.citadas.map((x) => `${x.sentencia.id} (${x.similitud.toFixed(2)})`).join(' · ')
          : 'ninguna — no se cita sin respaldo'
      }`,
    );
    for (const d of r.descartadas) L.push(`  descartada    ${d.id} — ${d.motivo}`);
    for (const f of r.fuentesCaidas) L.push(`  NO DISPONIBLE ${f}`);
  } else if (!c.interruptores.recuperadorActivo) {
    L.push('');
    L.push('FUENTES');
    L.push('  recuperador apagado — sin fuente verificable, no se cita');
  }

  if (c.validacion) {
    const v = c.validacion;
    L.push('');
    L.push('VALIDACIÓN DE REDACCIÓN');
    L.push(`  ${v.afirmacionesRespaldadas}/${v.afirmaciones} afirmaciones con hecho declarado`);
    L.push(`  ${v.sentenciasEnTexto.length} citas en el texto, todas del recuperador: ${v.ok ? 'sí' : 'NO'}`);
    for (const x of v.violaciones) L.push(`  ✕ ${x.tipo}: ${x.detalle}`);
  }

  L.push('');
  L.push(
    `INTERRUPTORES  recuperador ${c.interruptores.recuperadorActivo ? 'ON' : 'OFF'} · ` +
      `LLM ${c.interruptores.llmActivo ? 'ON' : 'OFF'}`,
  );

  L.push('');
  L.push('─'.repeat(74));
  L.push('HUELLA SHA-256');
  L.push(`  ${c.huella}`);
  L.push('  Prueba que este certificado no fue alterado después de emitirse.');
  L.push('─'.repeat(74));

  return L.join('\n');
}
