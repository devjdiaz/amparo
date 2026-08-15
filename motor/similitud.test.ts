import { describe, expect, it } from 'vitest';
import { explicarPuntaje, Indice, normalizar, terminos, type Puntuable } from './similitud';

/**
 * Corpus de forma realista para calibrar. Los ids son de relleno hasta que
 * entre el corpus verificado — lo que se prueba acá es la recuperación, no
 * las sentencias.
 *
 * Ojo: el corpus tiene que ser plausible, no mínimo. Con dos sentencias el
 * IDF no discrimina nada y las pruebas mentirían.
 */
const CORPUS: Puntuable[] = [
  {
    id: 'CITA',
    tema: 'Negación de cita con especialista pese a orden del médico tratante',
    subregla:
      'La EPS no puede dilatar la autorización de una cita ordenada por el médico tratante; la demora injustificada constituye una barrera de acceso al servicio de salud.',
    etiquetas: ['cita', 'especialista', 'autorizacion', 'orden medica', 'barrera de acceso'],
  },
  {
    id: 'MEDICAMENTO',
    tema: 'No entrega de medicamento formulado por el médico tratante',
    subregla:
      'La entrega oportuna del medicamento formulado hace parte del núcleo esencial del servicio de salud y no puede condicionarse a trámites administrativos.',
    etiquetas: ['medicamento', 'entrega', 'formula', 'tramite administrativo'],
  },
  {
    id: 'PROCEDIMIENTO',
    tema: 'Negación de procedimiento quirúrgico previamente autorizado',
    subregla:
      'Autorizado el procedimiento por la EPS, no puede revocarse ni dilatarse su realización por razones administrativas o presupuestales.',
    etiquetas: ['procedimiento', 'cirugia', 'revocacion', 'orden medica'],
  },
  {
    id: 'INTEGRALIDAD',
    tema: 'Tratamiento integral para paciente con enfermedad catastrófica',
    subregla:
      'Frente a una enfermedad catastrófica procede ordenar el tratamiento integral, incluidos los servicios futuros que el médico tratante determine.',
    etiquetas: ['tratamiento integral', 'enfermedad catastrofica', 'servicios futuros'],
  },
  {
    id: 'TRANSPORTE',
    tema: 'Transporte y viáticos para acceder al servicio de salud',
    subregla:
      'Cuando el paciente carece de recursos, la EPS debe cubrir el transporte necesario para acceder al servicio de salud ordenado.',
    etiquetas: ['transporte', 'viaticos', 'recursos', 'barrera de acceso'],
  },
  {
    id: 'VIVIENDA',
    tema: 'Subsidio de vivienda de interés social',
    subregla:
      'El subsidio de vivienda procede cuando el hogar acredita los requisitos del programa y la entidad omite resolver.',
    etiquetas: ['vivienda', 'subsidio', 'hogar'],
  },
];

const indice = new Indice(CORPUS);

describe('normalización', () => {
  it('quita tildes y baja a minúsculas', () => {
    expect(normalizar('Neurología URGENTE')).toBe('neurologia urgente');
  });

  it('descarta palabras vacías y cortas', () => {
    expect(terminos('de la que se por')).toEqual([]);
  });

  it('recorta plurales para que singular y plural coincidan', () => {
    expect(terminos('medicamento')[0]).toBe(terminos('medicamentos')[0]);
  });
});

describe('idf · el corpus decide solo qué palabra distingue', () => {
  it('un término que está en una sola sentencia vale más que uno común', () => {
    // 'medicamento' aparece en una; 'salud' aparece en varias.
    expect(indice.pesoDe(terminos('medicamento')[0])).toBeGreaterThan(
      indice.pesoDe(terminos('salud')[0]),
    );
  });

  it('un término que el corpus no conoce vale cero', () => {
    expect(indice.pesoDe(terminos('neurologia')[0])).toBe(0);
  });
});

describe('recuperación · cita la sentencia correcta', () => {
  it('una consulta de citas trae la sentencia de citas primero', () => {
    const [mejor] = indice.buscar(
      'cita con especialista en neurología · no asignación · orden del médico tratante',
    );
    expect(mejor.sentencia.id).toBe('CITA');
  });

  it('una consulta de medicamentos trae la de medicamentos primero', () => {
    // Este es el caso que fallaba antes de IDF: 'orden del médico tratante'
    // arrastraba la sentencia de citas por encima de la correcta.
    const [mejor] = indice.buscar(
      'entrega de medicamento oncológico · no entrega · orden del médico tratante',
    );
    expect(mejor.sentencia.id).toBe('MEDICAMENTO');
  });

  it('una consulta de procedimientos trae la de procedimientos primero', () => {
    const [mejor] = indice.buscar(
      'procedimiento quirúrgico ya autorizado · revocación · orden del médico tratante',
    );
    expect(mejor.sentencia.id).toBe('PROCEDIMIENTO');
  });

  it('una consulta de otro dominio no rescata nada de salud', () => {
    const resultados = indice.buscar('reconocimiento de pensión de vejez · mínimo vital');
    const salud = resultados.filter((r) => r.sentencia.id !== 'VIVIENDA');
    for (const r of salud) expect(r.puntaje.similitud).toBeLessThan(0.2);
  });
});

describe('gate por etiquetas · red de seguridad contra la cita fuera de tema', () => {
  it('una sentencia sin etiqueta en común no compite, aunque puntuaría', () => {
    const resultados = indice.buscar('entrega de medicamento formulado', {
      etiquetasRequeridas: ['vivienda'],
    });
    const medicamento = resultados.find((r) => r.sentencia.id === 'MEDICAMENTO');
    expect(medicamento?.fueraDeGate).toBe(true);
    expect(medicamento?.puntaje.similitud).toBe(0);
  });

  it('sin gate, todas compiten', () => {
    const resultados = indice.buscar('entrega de medicamento formulado');
    expect(resultados.every((r) => r.fueraDeGate === false)).toBe(true);
  });
});

describe('explicación · no hay puntaje sin razón', () => {
  it('lista los términos que coincidieron, empezando por el que más pesó', () => {
    const p = indice.puntuar('entrega de medicamento formulado', 'MEDICAMENTO');
    const texto = explicarPuntaje(p);
    expect(texto).toMatch(/de \d+ términos con valor/);
    expect(texto).toContain('etiqueta');
    expect(p.coincidencias[0].peso).toBeGreaterThanOrEqual(
      p.coincidencias[p.coincidencias.length - 1].peso,
    );
  });

  it('lo dice claro cuando no coincidió nada', () => {
    expect(explicarPuntaje(indice.puntuar('vivienda subsidio hogar', 'MEDICAMENTO'))).toContain(
      'ningún término',
    );
  });
});
