/**
 * AMPARO · Suite de casos de referencia.
 *
 * Se escribe ANTES que el LLM. Es lo único que avisa a las cinco de la
 * mañana que algo se rompió. Corre sin red, sin base de datos y sin modelo.
 *
 *   pnpm vitest run
 */

import { describe, expect, it } from 'vitest';
import { campo, expedienteVacio, Expediente, HechoSinOrigen, Memoria } from './tipos';
import { evaluarProcedibilidad, DIAS_INMEDIATEZ } from './compuertas';
import { calcularFuerza, UMBRAL_MEDIDA_PROVISIONAL } from './fuerza';
import {
  filtrarCandidatas,
  construirConsulta,
  idsCitados,
  UMBRAL_SIMILITUD,
  Candidata,
} from './recuperador';
import { validarRedaccion } from './validador';
import { emitirCertificado, renderCertificado } from './certificado';
import { huellaDe, verificarHuella } from './huella';

const HOY = new Date('2026-08-15T12:00:00Z');

function memoriaCon(...pares: [string, string, string][]): Memoria {
  const m = new Memoria();
  for (const [id, contenido, ref] of pares) {
    m.agregar({ id, contenido, origen: { tipo: 'audio', ref } });
  }
  return m;
}

// ─────────────────────────────────────────────────────────────
describe('memoria · un hecho sin origen no entra', () => {
  it('rechaza origen vacío', () => {
    const m = new Memoria();
    expect(() =>
      m.agregar({ id: 'h1', contenido: 'me negaron la cita', origen: { tipo: 'audio', ref: '  ' } }),
    ).toThrow(HechoSinOrigen);
  });

  it('rechaza un derivado que no declara de dónde salió', () => {
    const m = new Memoria();
    expect(() =>
      m.agregar({ id: 'h9', contenido: '34 días de espera', origen: { tipo: 'derivado', ref: 'calc:dias' } }),
    ).toThrow(HechoSinOrigen);
  });

  it('traza un derivado hasta su origen primario', () => {
    const m = memoriaCon(['h1', 'me la negaron el 12 de julio', 'audio:00:09']);
    m.agregar({
      id: 'h2',
      contenido: '34 días transcurridos',
      origen: { tipo: 'derivado', ref: 'calc:dias', derivadoDe: ['h1'] },
    });
    expect(m.trazar('h2')).toEqual([{ tipo: 'audio', ref: 'audio:00:09' }]);
  });
});

// ─────────────────────────────────────────────────────────────
describe('caso 1 · negación de cita con especialista → PROCEDE', () => {
  const m = memoriaCon(
    ['h1', 'es para mí, tengo 71 años', 'audio:00:04'],
    ['h2', 'me negaron la cita el 12 de julio', 'audio:00:11'],
    ['h3', 'sigo sin la cita', 'audio:00:19'],
    ['h4', 'me duele mucho y no puedo caminar bien', 'audio:00:24'],
    ['h5', 'ya la pedí tres veces en la EPS', 'audio:00:31'],
    ['h6', 'el médico me la ordenó', 'audio:00:37'],
    ['h7', 'nunca he puesto una tutela', 'audio:00:44'],
    ['h8', '34 días esperando', 'audio:00:11'],
    ['h9', 'término reglamentario 5 días', 'norma:res-1552-2013'],
  );

  const exp: Expediente = {
    ...expedienteVacio,
    solicitanteEsTitular: campo(m, true, 'h1'),
    fechaVulneracion: campo(m, '2026-07-12', 'h2'),
    vulneracionContinua: campo(m, true, 'h3'),
    urgenciaClinica: campo(m, true, 'h4'),
    solicitudFormalPrevia: campo(m, true, 'h5'),
    tutelaPreviaMismosHechos: campo(m, false, 'h7'),
    sujetoEspecialProteccion: campo(m, 'adulto mayor, 71 años', 'h1'),
    ordenMedicaVigente: campo(m, true, 'h6'),
    negacionDocumentada: campo(m, false, 'h5'),
    diasEspera: campo(m, 34, 'h8'),
    diasReglamentarios: campo(m, 5, 'h9'),
    servicio: campo(m, 'cita con especialista', 'h6'),
    tipoNegacion: campo(m, 'no asignación de cita', 'h2'),
  };

  const proc = evaluarProcedibilidad(exp, HOY);

  it('procede con las cuatro compuertas en PASA', () => {
    expect(proc.salida).toBe('PROCEDE');
    expect(proc.compuertas.every((c) => c.veredicto === 'PASA')).toBe(true);
  });

  it('cada compuerta declara los hechos que la sustentan', () => {
    for (const c of proc.compuertas) expect(c.hechos.length).toBeGreaterThan(0);
  });

  it('la fuerza pide medida provisional y no sale de 100', () => {
    const f = calcularFuerza(exp);
    expect(f.total).toBeGreaterThanOrEqual(UMBRAL_MEDIDA_PROVISIONAL);
    expect(f.total).toBeLessThanOrEqual(100);
    expect(f.postura).toBe('MEDIDA_PROVISIONAL');
  });

  it('sugiere documentar la negación, que es lo único que le falta', () => {
    const f = calcularFuerza(exp);
    expect(f.sugerencias.join(' ')).toMatch(/radicado|pantallazo/i);
  });
});

// ─────────────────────────────────────────────────────────────
describe('caso 2 · ocho meses pero vulneración continuada → PROCEDE con excepción', () => {
  const m = memoriaCon(
    ['h1', 'es para mí', 'audio:00:03'],
    ['h2', 'me lo negaron en diciembre', 'audio:00:10'],
    ['h3', 'todavía no me lo entregan', 'audio:00:16'],
    ['h4', 'ya lo pedí por escrito', 'audio:00:22'],
    ['h5', 'sin dolor fuerte por ahora', 'audio:00:28'],
    ['h6', 'no he puesto tutelas', 'audio:00:33'],
  );

  const exp: Expediente = {
    ...expedienteVacio,
    solicitanteEsTitular: campo(m, true, 'h1'),
    fechaVulneracion: campo(m, '2025-12-05', 'h2'),
    vulneracionContinua: campo(m, true, 'h3'),
    urgenciaClinica: campo(m, false, 'h5'),
    solicitudFormalPrevia: campo(m, true, 'h4'),
    tutelaPreviaMismosHechos: campo(m, false, 'h6'),
  };

  const proc = evaluarProcedibilidad(exp, HOY);

  it('procede aunque pasaron más de 180 días', () => {
    expect(proc.salida).toBe('PROCEDE');
    const inm = proc.compuertas.find((c) => c.regla === 'inmediatez')!;
    expect(inm.veredicto).toBe('PASA');
    expect(inm.excepcion).toMatch(/continuada/i);
  });

  it('sin la vulneración continuada, la misma fecha falla', () => {
    const cerrado = { ...exp, vulneracionContinua: campo(m, false, 'h3') };
    const p = evaluarProcedibilidad(cerrado, HOY);
    expect(p.salida).toBe('NO_PROCEDE');
    expect(p.rutas[0].accion).toMatch(/Supersalud|Superintendencia/i);
  });

  it('el umbral de inmediatez está declarado, no escondido', () => {
    expect(DIAS_INMEDIATEZ).toBe(180);
  });
});

// ─────────────────────────────────────────────────────────────
describe('caso 3 · improcedente por subsidiariedad → NO_PROCEDE con ruta', () => {
  const m = memoriaCon(
    ['h1', 'es para mí', 'audio:00:03'],
    ['h2', 'me dijeron que no hace dos semanas', 'audio:00:09'],
    ['h3', 'no, nunca lo he pedido por escrito', 'audio:00:17'],
    ['h4', 'no me duele, es de control', 'audio:00:23'],
    ['h5', 'no he puesto tutelas', 'audio:00:29'],
  );

  const exp: Expediente = {
    ...expedienteVacio,
    solicitanteEsTitular: campo(m, true, 'h1'),
    fechaVulneracion: campo(m, '2026-08-01', 'h2'),
    urgenciaClinica: campo(m, false, 'h4'),
    solicitudFormalPrevia: campo(m, false, 'h3'),
    tutelaPreviaMismosHechos: campo(m, false, 'h5'),
  };

  const proc = evaluarProcedibilidad(exp, HOY);

  it('no procede, y falla exactamente en subsidiariedad', () => {
    expect(proc.salida).toBe('NO_PROCEDE');
    const fallas = proc.compuertas.filter((c) => c.veredicto === 'FALLA');
    expect(fallas).toHaveLength(1);
    expect(fallas[0].regla).toBe('subsidiariedad');
  });

  it('nunca un no seco: sale con ruta, con plazo y generable aquí mismo', () => {
    expect(proc.rutas).toHaveLength(1);
    expect(proc.rutas[0].accion).toMatch(/petición/i);
    expect(proc.rutas[0].plazo).toMatch(/15 días/);
    expect(proc.rutas[0].generable).toBe(true);
  });

  it('las otras tres compuertas se evaluaron igual, sin corto circuito', () => {
    const pasan = proc.compuertas.filter((c) => c.veredicto === 'PASA');
    expect(pasan).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────
describe('caso 4 · faltan datos → pregunta puntual, no un no', () => {
  const m = memoriaCon(
    ['h1', 'es para mi mamá', 'audio:00:05'],
    ['h2', 'ella no se puede mover de la casa', 'audio:00:12'],
    ['h3', 'le negaron el medicamento el 20 de julio', 'audio:00:20'],
    ['h4', 'sí, ya lo pidió en la farmacia y le dijeron que no', 'audio:00:28'],
    ['h5', 'le está subiendo la presión', 'audio:00:34'],
  );

  const exp: Expediente = {
    ...expedienteVacio,
    solicitanteEsTitular: campo(m, false, 'h1'),
    titularPuedeActuarPorSiMismo: campo(m, false, 'h2'),
    fechaVulneracion: campo(m, '2026-07-20', 'h3'),
    urgenciaClinica: campo(m, true, 'h5'),
    solicitudFormalPrevia: campo(m, true, 'h4'),
    // tutelaPreviaMismosHechos queda en null: el audio no lo dijo
  };

  const proc = evaluarProcedibilidad(exp, HOY);

  it('no dice que no: dice qué falta', () => {
    expect(proc.salida).toBe('FALTAN_DATOS');
    expect(proc.preguntas).toHaveLength(1);
    expect(proc.preguntas[0]).toMatch(/tutela antes/i);
  });

  it('nunca asume que no hubo tutela previa: la temeridad tiene sanción', () => {
    const temeridad = proc.compuertas.find((c) => c.regla === 'no_temeridad')!;
    expect(temeridad.veredicto).toBe('INDETERMINADO');
  });

  it('la agencia oficiosa pasa y queda declarada como excepción', () => {
    const leg = proc.compuertas.find((c) => c.regla === 'legitimacion')!;
    expect(leg.veredicto).toBe('PASA');
    expect(leg.excepcion).toMatch(/agencia oficiosa/i);
  });
});

// ─────────────────────────────────────────────────────────────
describe('interruptor 1 · el recuperador prefiere no citar', () => {
  const sent = (id: string, sim: number): Candidata => ({
    similitud: sim,
    sentencia: {
      id,
      url: `https://www.corteconstitucional.gov.co/relatoria/${id.replace('/', '-')}`,
      tema: 'salud',
      subregla: 'subregla curada a mano',
      verificadaEl: '2026-08-15',
    },
  });

  // Los puntajes se escriben RELATIVOS al umbral, no con números a mano.
  // El umbral se recalibra cada vez que cambia el corpus (ver scripts/
  // calibrar.ts) y estas pruebas tienen que seguir midiendo lo mismo: que
  // por debajo del umbral no se cita y que el descarte lleva su motivo.
  const arriba = UMBRAL_SIMILITUD + 0.13;
  const abajo = UMBRAL_SIMILITUD - 0.13;

  it('cita solo lo que supera el umbral y explica cada descarte', () => {
    const r = filtrarCandidatas('cita especialista', [
      sent('T-760/08', arriba),
      sent('T-405/17', abajo),
    ]);
    expect(idsCitados(r)).toEqual(['T-760/08']);
    expect(r.descartadas[0].motivo).toMatch(/umbral/);
  });

  it('con nada por encima del umbral, entrega cero citas y no inventa', () => {
    const r = filtrarCandidatas('caso raro', [
      sent('T-405/17', abajo),
      sent('T-121/15', abajo - 0.07),
    ]);
    expect(r.citadas).toHaveLength(0);
    expect(r.descartadas).toHaveLength(2);
  });

  it('el umbral está declarado y es un número entre 0 y 1, no magia', () => {
    expect(UMBRAL_SIMILITUD).toBeGreaterThan(0);
    expect(UMBRAL_SIMILITUD).toBeLessThan(1);
  });

  it('la consulta se arma del expediente, no de la transcripción', () => {
    const m = memoriaCon(['h1', 'cita con neurología', 'audio:00:12']);
    const exp: Expediente = {
      ...expedienteVacio,
      servicio: campo(m, 'cita con especialista en neurología', 'h1'),
      tipoNegacion: campo(m, 'no asignación', 'h1'),
    };
    const q = construirConsulta(exp, calcularFuerza(exp));
    expect(q).toContain('neurología');
    expect(q).not.toContain('audio');
  });
});

// ─────────────────────────────────────────────────────────────
describe('la aduana · el texto del LLM no puede decir lo que quiera', () => {
  const m = memoriaCon(
    ['h1', 'le negaron la cita el 12 de julio', 'audio:00:11'],
    ['h2', 'tiene 71 años', 'audio:00:04'],
  );

  it('acepta texto con toda afirmación marcada y citas del recuperador', () => {
    const texto =
      'A la accionante, de 71 años [#h2], le fue negada la cita el 12 de julio de 2026 [#h1]. ' +
      'La Corte se pronunció sobre este supuesto en la sentencia T-760/08 [#h1]. ' +
      'Solicito ordenar la asignación de la cita.';
    const v = validarRedaccion(texto, m, ['T-760/08']);
    expect(v.ok).toBe(true);
    expect(v.afirmacionesRespaldadas).toBe(v.afirmaciones);
  });

  it('rechaza una sentencia que el recuperador nunca entregó', () => {
    const texto = 'Según la sentencia T-999/21 [#h1], procede el amparo.';
    const v = validarRedaccion(texto, m, ['T-760/08']);
    expect(v.ok).toBe(false);
    expect(v.violaciones[0].tipo).toBe('CITA_NO_RECUPERADA');
  });

  it('con el recuperador apagado, cualquier cita es violación', () => {
    const texto = 'Conforme a la sentencia T-760/08 [#h1], procede el amparo.';
    const v = validarRedaccion(texto, m, []);
    expect(v.ok).toBe(false);
    expect(v.violaciones[0].detalle).toMatch(/no entregó ninguna sentencia/i);
  });

  it('rechaza una afirmación sin marca', () => {
    const v = validarRedaccion('La accionante lleva ocho meses esperando.', m, []);
    expect(v.violaciones[0].tipo).toBe('AFIRMACION_SIN_RESPALDO');
  });

  it('rechaza una marca a un hecho que no existe', () => {
    const v = validarRedaccion('La EPS negó el servicio [#h77].', m, []);
    expect(v.violaciones[0].tipo).toBe('HECHO_INEXISTENTE');
  });
});

// ─────────────────────────────────────────────────────────────
describe('interruptor 2 · el veredicto no depende del modelo', () => {
  it('el motor corre completo sin tocar LLM, red ni base de datos', () => {
    const m = memoriaCon(
      ['h1', 'es para mí', 'audio:00:03'],
      ['h2', 'me lo negaron el 1 de agosto', 'audio:00:09'],
      ['h3', 'no lo he pedido por escrito', 'audio:00:15'],
      ['h4', 'no es urgente', 'audio:00:20'],
      ['h5', 'no he puesto tutelas', 'audio:00:25'],
    );
    const exp: Expediente = {
      ...expedienteVacio,
      solicitanteEsTitular: campo(m, true, 'h1'),
      fechaVulneracion: campo(m, '2026-08-01', 'h2'),
      urgenciaClinica: campo(m, false, 'h4'),
      solicitudFormalPrevia: campo(m, false, 'h3'),
      tutelaPreviaMismosHechos: campo(m, false, 'h5'),
    };

    const a = evaluarProcedibilidad(exp, HOY);
    const b = evaluarProcedibilidad(exp, HOY);
    expect(a).toEqual(b);
    expect(a.salida).toBe('NO_PROCEDE');
  });
});

// ─────────────────────────────────────────────────────────────
describe('certificado · se emite también cuando no procede', () => {
  it('el no procede sale con certificado y con la ruta impresa', () => {
    const m = memoriaCon(
      ['h1', 'es para mí', 'audio:00:03'],
      ['h2', 'me lo negaron el 1 de agosto', 'audio:00:09'],
      ['h3', 'no lo he pedido por escrito', 'audio:00:15'],
      ['h4', 'no es urgente', 'audio:00:20'],
      ['h5', 'no he puesto tutelas', 'audio:00:25'],
    );
    const exp: Expediente = {
      ...expedienteVacio,
      solicitanteEsTitular: campo(m, true, 'h1'),
      fechaVulneracion: campo(m, '2026-08-01', 'h2'),
      urgenciaClinica: campo(m, false, 'h4'),
      solicitudFormalPrevia: campo(m, false, 'h3'),
      tutelaPreviaMismosHechos: campo(m, false, 'h5'),
    };

    const cert = emitirCertificado({
      casoId: 'demo-03',
      reglasHash: 'a91c4e',
      corpusVersion: '2026-08-15',
      procedibilidad: evaluarProcedibilidad(exp, HOY),
      ahora: HOY,
    });

    const texto = renderCertificado(cert);
    expect(texto).toContain('NO_PROCEDE');
    expect(texto).toContain('LO QUE SÍ LE SIRVE HOY');
    expect(texto).toContain('subsidiariedad');
  });
});

// ─────────────────────────────────────────────────────────────
describe('huella · el certificado impreso se puede verificar', () => {
  const base = () => {
    const m = memoriaCon(['h1', 'es para mí', 'audio:00:03']);
    const exp: Expediente = {
      ...expedienteVacio,
      solicitanteEsTitular: campo(m, true, 'h1'),
    };
    return emitirCertificado({
      casoId: 'demo-huella',
      reglasHash: 'a91c4e',
      corpusVersion: '2026-08-15',
      procedibilidad: evaluarProcedibilidad(exp, HOY),
      ahora: HOY,
    });
  };

  it('un certificado recién emitido verifica', () => {
    expect(verificarHuella(base())).toBe(true);
  });

  it('alterar cualquier campo rompe la huella', () => {
    const alterado = { ...base(), casoId: 'otro-caso' };
    expect(verificarHuella(alterado)).toBe(false);
  });

  it('el orden en que se armó el objeto no cambia la huella', () => {
    expect(huellaDe({ a: 1, b: { c: 2, d: 3 } })).toBe(
      huellaDe({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });

  it('la huella queda impresa en el certificado', () => {
    const cert = base();
    expect(renderCertificado(cert)).toContain(cert.huella);
  });
});
