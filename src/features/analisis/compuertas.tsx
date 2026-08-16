import { ArrowRight, CircleCheck, CircleHelp, CircleX, ShieldCheck } from 'lucide-react';
import { Insignia, Panel, Tarjeta } from '../shell/panel';
import type { Procedibilidad, ResultadoCompuerta, Veredicto } from '../../../motor/compuertas';

/**
 * Las cuatro compuertas de procedibilidad.
 *
 * Se muestran LAS CUATRO, siempre, incluidas las que pasaron cuando otra
 * falló. Salir en la primera falla daría un "no" con una sola razón, y la
 * regla de la casa es que un no nunca se entrega solo.
 *
 * El veredicto negativo va en ÁMBAR, nunca en rojo. Cuando alguien lleva
 * meses peleando con su EPS, un rectángulo rojo que diga "rechazado" le
 * reproduce exactamente la experiencia institucional que lo trajo hasta acá.
 */

const PREGUNTA: Record<ResultadoCompuerta['regla'], string> = {
  legitimacion: '¿Quien presenta es el afectado o agente oficioso?',
  inmediatez: '¿Cuánto tiempo pasó desde la vulneración?',
  subsidiariedad: '¿Hay otro medio de defensa idóneo?',
  no_temeridad: '¿Ya hubo tutela por los mismos hechos?',
};

const NOMBRE: Record<ResultadoCompuerta['regla'], string> = {
  legitimacion: 'Legitimación',
  inmediatez: 'Inmediatez',
  subsidiariedad: 'Subsidiariedad',
  no_temeridad: 'No temeridad',
};

const PINTA: Record<
  Veredicto,
  { icono: typeof CircleCheck; color: string; chip: string; estado: 'pasa' | 'falla' | 'duda' }
> = {
  PASA: {
    icono: CircleCheck,
    color: 'text-verde-400',
    chip: 'bg-[#4FB39426] text-verde-400',
    estado: 'pasa',
  },
  FALLA: {
    icono: CircleX,
    color: 'text-ambar-300',
    chip: 'bg-[#C97A2226] text-ambar-300',
    estado: 'falla',
  },
  INDETERMINADO: {
    icono: CircleHelp,
    color: 'text-texto-consola-2',
    chip: 'bg-[#14201C12] text-texto-consola-2',
    estado: 'duda',
  },
};

export function PanelCompuertas({ proc }: { proc: Procedibilidad }) {
  const pasan = proc.compuertas.filter((c) => c.veredicto === 'PASA').length;

  return (
    <Panel
      icono={<ShieldCheck className="size-[18px]" />}
      titulo="Motor de procedibilidad"
      insignia={
        <Insignia acento={proc.salida === 'PROCEDE' ? 'verde' : 'neutro'}>
          {pasan}/4 pasan
        </Insignia>
      }
      acento={proc.salida === 'PROCEDE' ? 'verde' : 'ambar'}
      className="w-full lg:w-[440px] lg:shrink-0"
    >
      <div className="flex flex-col gap-3">
        {proc.compuertas.map((c) => {
          const pinta = PINTA[c.veredicto];
          const Icono = pinta.icono;
          return (
            <Tarjeta key={c.regla} estado={pinta.estado}>
              <div className="flex items-start gap-3">
                <Icono className={`mt-0.5 size-[18px] shrink-0 ${pinta.color}`} aria-hidden />
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-texto-consola">
                      {NOMBRE[c.regla]}
                    </h3>
                    <span className="rounded-[4px] bg-[#14201C12] px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-texto-consola-3">
                      BLOQUEANTE
                    </span>
                  </div>
                  <p className="text-[12px] leading-5 text-texto-consola-3">
                    {PREGUNTA[c.regla]}
                  </p>
                  <p
                    className={`rounded-[4px] px-2 py-1 font-mono text-[11px] leading-5 ${pinta.chip}`}
                  >
                    {c.veredicto === 'PASA' ? '✓' : c.veredicto === 'FALLA' ? '✗' : '?'} {c.motivo}
                  </p>
                  {c.excepcion && (
                    <p className="text-[11px] leading-5 text-texto-consola-3">
                      <span className="text-verde-400">Excepción aplicada.</span> {c.excepcion}
                    </p>
                  )}
                  {c.pregunta && (
                    <p className="text-[11px] leading-5 text-ambar-300">Falta: {c.pregunta}</p>
                  )}
                  <p className="font-mono text-[10px] text-texto-consola-3">{c.fundamento}</p>
                </div>
              </div>
            </Tarjeta>
          );
        })}
      </div>

      <Veredicto proc={proc} />
    </Panel>
  );
}

function Veredicto({ proc }: { proc: Procedibilidad }) {
  const config = {
    PROCEDE: {
      titulo: 'LA TUTELA PROCEDE',
      sub: 'Las cuatro reglas de procedibilidad se cumplen',
      fondo: 'bg-[#4FB39418] border-verde-400',
      texto: 'text-verde-400',
      circulo: 'bg-verde-600',
      icono: CircleCheck,
    },
    NO_PROCEDE: {
      titulo: 'Este caso no va por tutela',
      sub: 'Hay otro camino que le sirve más y es más rápido',
      fondo: 'bg-[#C97A2220] border-ambar-300',
      texto: 'text-ambar-300',
      circulo: 'bg-ambar-500',
      // Flecha, no equis: hay a dónde ir. La equis diría "se acabó".
      icono: ArrowRight,
    },
    FALTAN_DATOS: {
      titulo: 'Me faltan datos para decidir',
      sub: `Son ${proc.preguntas.length} preguntas y le escribo la tutela`,
      fondo: 'bg-[#14201C0D] border-[#14201C26]',
      texto: 'text-texto-consola',
      circulo: 'bg-[#14201C26]',
      icono: CircleHelp,
    },
  }[proc.salida];

  const Icono = config.icono;

  return (
    <div className={`flex items-center gap-4 rounded-[18px] border p-4 ${config.fondo}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${config.circulo}`}>
        <Icono className="size-5 text-papel" strokeWidth={2.4} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`font-serif text-[16px] font-bold ${config.texto}`}>{config.titulo}</p>
        <p className="text-[12px] leading-5 text-texto-consola-2">{config.sub}</p>
      </div>
    </div>
  );
}
