/**
 * El mensaje que dice el Future Self.
 *
 * No inventa nada legal: sale de la misma `Procedibilidad` que ya calculó el
 * motor, sin tocarla. Control, no promesas — nunca dice que va a ganar, que
 * le van a devolver algo, que una autoridad va a fallar a su favor. Dice que
 * ya entiende su situación y que ya tiene un siguiente paso. Eso es lo único
 * que AMPARO puede garantizar, y es justo lo único que necesita decir.
 */

import type { Procedibilidad, RutaAlterna } from '../../motor/compuertas';

export function mensajeFutureSelf(
  procedibilidad: Pick<Procedibilidad, 'salida'>,
  rutas: RutaAlterna[],
): string {
  if (procedibilidad.salida === 'PROCEDE') {
    return 'Ya entiendo lo que me pasó. Ya sé cuáles son mis opciones. Y ya tengo un siguiente paso.';
  }

  if (procedibilidad.salida === 'NO_PROCEDE' && rutas[0]) {
    return `Ya no estoy perdido en esto. Sé que mi siguiente paso es ${rutas[0].accion.toLowerCase()}, y sé exactamente cómo darlo.`;
  }

  return 'Ya entiendo mi situación mejor que hace un rato. Y ya sé qué preguntar para dar el siguiente paso.';
}
