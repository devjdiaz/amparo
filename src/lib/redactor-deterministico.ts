/**
 * AMPARO · Redacción sin modelo.
 *
 * ---------------------------------------------------------------------------
 * ESTO NO ES UN PLAN B. Es el camino por defecto.
 *
 * Sin esta función el interruptor 2 no existe: apagar el modelo dejaría la
 * pantalla en blanco en vez de demostrar la tesis. Y si a las 4am se cae la
 * red, el wifi del claustro, o la llave llega al límite, el demo sigue en pie.
 *
 * El modelo redacta MEJOR. Pero el sistema tiene que funcionar sin él, porque
 * la afirmación central del proyecto es justamente que la decisión no depende
 * del modelo — y eso solo se puede demostrar si hay un camino que lo prueba.
 * ---------------------------------------------------------------------------
 *
 * Cada oración sale de un campo del expediente que tiene un hecho detrás, y
 * lleva su marca [#h1] igual que la del modelo. Así el validador puede
 * auditar los dos caminos con las mismas reglas.
 */

import type { Expediente } from '../../motor/tipos';
import { valor } from '../../motor/tipos';
import type { Fuerza } from '../../motor/fuerza';

/** `Quizás<T>` con su marca, listo para meter en una oración. */
function conMarca<T>(campo: { valor: T; hecho: string } | null): string {
  return campo ? ` [#${campo.hecho}]` : '';
}

function enEspanol(iso: string): string {
  const f = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function redactarDeterministico(exp: Expediente, fuerza: Fuerza | null): string {
  const partes: string[] = [];

  partes.push('I. HECHOS');
  partes.push('');

  // --- PRIMERO: la orden médica, que es la prueba que más pesa en salud.
  const servicio = valor(exp.servicio);
  if (exp.ordenMedicaVigente && valor(exp.ordenMedicaVigente) === true) {
    partes.push(
      `PRIMERO. El médico tratante ordenó ${servicio ?? 'el servicio de salud requerido'}` +
        `${conMarca(exp.ordenMedicaVigente)}${conMarca(exp.servicio)}.`,
    );
  } else if (servicio) {
    partes.push(`PRIMERO. Requiero ${servicio}${conMarca(exp.servicio)}.`);
  }

  // --- SEGUNDO: la negación y su fecha.
  const fecha = valor(exp.fechaVulneracion);
  const tipo = valor(exp.tipoNegacion);
  const entidad = valor(exp.entidad) ?? 'la EPS';
  if (fecha) {
    partes.push(
      `SEGUNDO. El ${enEspanol(fecha)}, ${entidad} me comunicó ` +
        `${tipo ? `la ${tipo}` : 'la negativa'} del servicio` +
        `${conMarca(exp.fechaVulneracion)}${conMarca(exp.tipoNegacion)}.`,
    );
  }

  // --- TERCERO: la solicitud previa, que es lo que abre la puerta de la tutela.
  if (valor(exp.solicitudFormalPrevia) === true) {
    partes.push(
      `TERCERO. Solicité el servicio directamente a ${entidad} y no me fue ` +
        `entregado${conMarca(exp.solicitudFormalPrevia)}.`,
    );
  }

  // --- CUARTO: cuánto lleva esperando, contra el término reglamentario.
  const espera = valor(exp.diasEspera);
  const reglamentario = valor(exp.diasReglamentarios);
  if (espera !== null) {
    const contra =
      reglamentario !== null
        ? `, cuando el término reglamentario es de ${reglamentario} días${conMarca(exp.diasReglamentarios)}`
        : '';
    partes.push(
      `CUARTO. Han transcurrido ${espera} días sin que se resuelva mi ` +
        `situación${contra}${conMarca(exp.diasEspera)}.`,
    );
  }

  // --- QUINTO: la condición personal que agrava la afectación.
  const sujeto = valor(exp.sujetoEspecialProteccion);
  if (sujeto) {
    partes.push(
      `QUINTO. Soy sujeto de especial protección constitucional: ` +
        `${sujeto}${conMarca(exp.sujetoEspecialProteccion)}.`,
    );
  }
  if (valor(exp.urgenciaClinica) === true) {
    partes.push(
      `SEXTO. Mi estado de salud se deteriora mientras espero, lo que configura ` +
        `un perjuicio irremediable${conMarca(exp.urgenciaClinica)}.`,
    );
  }

  // --- Pretensiones
  partes.push('');
  partes.push('II. PRETENSIONES');
  partes.push('');
  partes.push(
    `PRIMERA. Que se tutele mi derecho fundamental a la salud y se ordene a ` +
      `${entidad} autorizar y prestar ${servicio ?? 'el servicio requerido'} de manera ` +
      `inmediata${conMarca(exp.servicio)}.`,
  );

  if (fuerza?.postura === 'MEDIDA_PROVISIONAL') {
    partes.push(
      'SEGUNDA. Que, como medida provisional, se ordene la prestación del ' +
        'servicio mientras se resuelve de fondo la presente acción.',
    );
  }

  partes.push(
    'TERCERA. Que se ordene la atención integral de la patología que motiva ' +
      'esta solicitud.',
  );

  return partes.join('\n');
}
