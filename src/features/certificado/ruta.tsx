import { Route } from 'lucide-react';
import { Panel } from '../shell/panel';
import type { PasoRuta } from '../../lib/decidir';

/**
 * La ruta de decisión, paso por paso y con su tiempo.
 *
 * No es un log: es la secuencia real del motor, en orden, con lo que decidió
 * en cada punto. Poder seguirla de arriba abajo es lo que permite auditar sin
 * leer el código.
 *
 * Las cuatro compuertas se pintan distinto porque son las que deciden. El
 * resto son pasos de preparación.
 */
export function RutaDecision({ pasos }: { pasos: PasoRuta[] }) {
  return (
    <Panel icono={<Route className="size-[18px]" />} titulo="Ruta de decisión">
      <ol className="flex flex-col gap-3">
        {pasos.map((p, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-14 shrink-0 pt-0.5 text-right font-mono text-[10px] text-texto-consola-3">
              +{p.ms}ms
            </span>
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${
                p.esCompuerta ? 'bg-verde-400' : 'bg-verde-700'
              }`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-texto-consola">
                {p.paso}
                {p.esCompuerta && (
                  <span className="ml-2 rounded-[4px] bg-[#FFFFFF12] px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-texto-consola-3">
                    COMPUERTA
                  </span>
                )}
              </p>
              <p className="text-[12px] leading-5 text-texto-consola-2">{p.detalle}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-[11px] leading-5 text-texto-consola-3">
        Todo esto ocurrió sin tocar la red y sin invocar ningún modelo. Los tiempos
        son reales: el motor entero resuelve en milisegundos.
      </p>
    </Panel>
  );
}
