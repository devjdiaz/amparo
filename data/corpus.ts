/**
 * AMPARO · Corpus de jurisprudencia.
 *
 * Siete sentencias de la Corte Constitucional sobre acceso efectivo al
 * servicio de salud. Es el único lugar de donde el redactor puede sacar una
 * cita: si una sentencia no está acá, no existe para el sistema.
 *
 * ---------------------------------------------------------------------------
 * Cómo se armó, y qué garantiza cada campo
 *
 *   url        Se abrió y se leyó. `pnpm tsx scripts/verificar-corpus.ts`
 *              vuelve a comprobar que responde, y corre antes de grabar.
 *   textual    Cita literal tomada de esa página. Es lo que permite que
 *              cualquiera contraste la subregla contra la fuente sin
 *              confiar en nosotros.
 *   subregla   Paráfrasis de `textual`. Es lo ÚNICO que el redactor puede
 *              reformular. No dice nada que la cita textual no sostenga.
 *   etiquetas  Curadas a mano. Son el gate del recuperador y lo que más pesa
 *              en el puntaje, así que se escriben pensando en qué consulta
 *              debería traer esta sentencia y cuál no.
 *
 * ---------------------------------------------------------------------------
 * Criterio de selección: posteriores a la Ley Estatutaria 1751 de 2015
 *
 * Se descartaron a propósito varias sentencias muy citadas de 2009–2014 que
 * razonan sobre el POS y los Comités Técnico-Científicos. Esas figuras ya no
 * existen: la Ley 1751 de 2015 volvió la salud un derecho fundamental
 * autónomo y cambió el marco. Citarlas se vería erudito y sería citar derecho
 * muerto — exactamente lo que este proyecto existe para evitar.
 *
 * La excepción es T-760 de 2008, que se conserva porque es la sentencia
 * estructural que fundó la línea y sigue siendo citada como tal; se usa solo
 * por su regla general, no por su tratamiento del POS.
 * ---------------------------------------------------------------------------
 */

export interface SentenciaCorpus {
  id: string;
  url: string;
  tema: string;
  /** Paráfrasis. Lo único que el redactor puede reformular. */
  subregla: string;
  /** Cita literal de la sentencia. Permite contrastar sin confiar en nosotros. */
  textual: string;
  etiquetas: string[];
  verificadaEl: string;
}

export const CORPUS_VERSION = '2026-08-16';

export const CORPUS: SentenciaCorpus[] = [
  {
    id: 'T-760/08',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2008/t-760-08.htm',
    tema: 'Salud como derecho fundamental autónomo y cargas administrativas de la EPS',
    subregla:
      'El acceso a un servicio de salud requerido es un derecho fundamental autónomo. La EPS no puede exigirle al afiliado el cumplimiento de trámites que son cargas administrativas propias de la entidad.',
    textual:
      'Las EPS no pueden imponer como requisito de acceso a un servicio de salud el cumplimiento de cargas administrativas propias de la entidad.',
    etiquetas: [
      'derecho fundamental autonomo',
      'carga administrativa',
      'acceso oportuno',
      'requisito de acceso',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-252/24',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2024/t-252-24.htm',
    tema: 'Barreras administrativas frente a servicios ordenados por el médico tratante',
    subregla:
      'Negar el acceso oportuno, continuo y efectivo a los servicios, insumos y tecnologías ordenados por el médico tratante, mediante barreras y restricciones administrativas, vulnera el derecho fundamental a la salud. La afectación es más grave cuando quien la sufre es sujeto de especial protección constitucional.',
    textual:
      'Las EPS accionadas vulneraron el derecho fundamental a la salud de las y los accionantes —sujetos de especial protección constitucional— al negarles el acceso oportuno, continuo y efectivo a los servicios, insumos y tecnologías en salud ordenados por el médico tratante, a partir de barreras y restricciones administrativas.',
    // Ojo con las etiquetas: 'medico tratante' y 'sujeto de especial
    // proteccion' son encuadre jurídico, no tema. Aparecen en TODOS los casos
    // de salud, así que como etiqueta (peso 1.0) hacían que esta sentencia
    // compitiera de igual a igual con la que sí trata del asunto. Siguen
    // presentes en `tema` y `subregla`, donde pesan menos y es su lugar.
    etiquetas: [
      'barrera administrativa',
      'restriccion administrativa',
      'acceso oportuno',
      'insumos',
      'negacion de servicio',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-377/24',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2024/t-377-24.htm',
    tema: 'Demora en la programación de cita con especialista pese a autorización previa',
    subregla:
      'El principio de oportunidad obliga a que toda persona acceda a la prestación sin dilaciones, en el momento oportuno y bajo las condiciones que defina el médico tratante. Solo razones estrictamente médicas justifican un retraso: no programar oportunamente las consultas con especialistas vulnera el derecho a la salud.',
    textual:
      'este obliga a garantizar que toda persona pueda acceder a la prestación de servicios sin dilaciones, en el momento oportuno para recuperar su salud y bajo las condiciones definidas por el médico tratante. Solo razones estrictamente médicas justifican un retraso en la prestación del servicio',
    // Cita Y consulta: la sentencia usa las dos palabras ("programación de
    // cita con endocrinología", "no programar oportunamente las consultas con
    // especialistas"). Tener solo una hacía que el puntaje dependiera de qué
    // palabra le saliera al extractor, que es una lotería que no queremos.
    etiquetas: [
      'cita',
      'consulta',
      'especialista',
      'especializada',
      'demora',
      'dilacion',
      'agendamiento',
      'programacion',
      'autorizacion previa',
      'oportunidad',
      'adulto mayor',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-510/24',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2024/t-510-24.htm',
    tema: 'Inoportunidad en la gestión del prestador como barrera de acceso',
    subregla:
      'No basta con que la EPS ofrezca el servicio: tiene que garantizar que se preste de manera efectiva y oportuna. Una demora que nace de la gestión administrativa de sus prestadores obstaculiza el acceso igual que una negativa expresa.',
    textual:
      'aunque la EPS cumple con la obligación de ofrecer los servicios de salud, el acceso efectivo a ellos puede verse obstaculizado por la inoportunidad en la gestión por parte de sus prestadores, es decir, por asuntos netamente administrativos. En este contexto, es fundamental que la EPS no solo brinde los servicios, sino que también garantice la atención, de manera efectiva y oportuna.',
    etiquetas: [
      'inoportunidad',
      'demora',
      'gestion del prestador',
      'barrera administrativa',
      'acceso efectivo',
      'transporte',
      'enfermedad huerfana',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-380/24',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2024/t-380-24.htm',
    tema: 'Suministro de medicamento oncológico ordenado por el médico tratante',
    subregla:
      'El tratamiento debe brindarse de manera ininterrumpida, completa y oportuna, con mayor razón frente a enfermedades catastróficas o de alto costo como el cáncer. La autonomía del médico tratante no se puede desplazar por reparos administrativos sobre la presentación del medicamento.',
    textual:
      'vale la pena llamar la atención sobre la necesidad de que el tratamiento se brinde de manera ininterrumpida, completa y oportuna, especialmente tratándose de las enfermedades catastróficas, ruinosas o de alto costo, como las patologías de cáncer',
    etiquetas: [
      'medicamento',
      'entrega',
      'suministro',
      'formula',
      'oncologico',
      'cancer',
      'enfermedad catastrofica',
      'autonomia medica',
      'tratamiento ininterrumpido',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-268/23',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2023/T-268-23.htm',
    tema: 'Prescripción del médico tratante y procedencia del tratamiento integral',
    subregla:
      'Existiendo prescripción del médico tratante, el servicio se ordena directamente por vía de tutela. El tratamiento integral procede cuando hay negligencia de la EPS, prescripciones médicas concretas y la persona es sujeto de especial protección o está en condiciones precarias de salud.',
    // La página parte el "si" inicial con etiquetas <i>; la sonda arranca
    // en "existe", que es donde el texto vuelve a ser continuo.
    textual: 'existe prescripción médica se debe ordenar directamente cuando fuere solicitado por vía de tutela',
    etiquetas: [
      'prescripcion medica',
      'tratamiento integral',
      'negligencia',
      'enfermeria domiciliaria',
    ],
    verificadaEl: '2026-08-15',
  },
  {
    id: 'T-195/21',
    url: 'https://www.corteconstitucional.gov.co/relatoria/2021/T-195-21.htm',
    tema: 'Integralidad y barreras geográficas para reclamar el tratamiento',
    subregla:
      'La prestación de servicios y tecnologías se guía por el principio de integralidad. Obligar al paciente a desplazarse a otro municipio para reclamar parte de su tratamiento constituye una barrera para el goce efectivo del derecho a la salud.',
    textual:
      'la prestación y el suministro de servicios y tecnologías deberá guiarse por el principio de integralidad... garantizar el derecho a la salud, de tal manera que los afiliados al sistema puedan acceder a las prestaciones de manera efectiva',
    etiquetas: [
      'integralidad',
      'barrera geografica',
      'desplazamiento',
      'suministro',
      'acceso efectivo',
    ],
    verificadaEl: '2026-08-15',
  },
];
