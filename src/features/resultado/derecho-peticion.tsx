import { FileText, Printer } from 'lucide-react';
import { ConMarcas } from './tutela';

/**
 * El derecho de petición, generado en el momento.
 *
 * Es la ruta alterna real (no un botón muerto) para cuando la tutela falla
 * por subsidiariedad: `motor/compuertas.ts` marca esta ruta `generable: true`
 * porque el texto sale del mismo expediente, sin modelo y sin red — igual
 * que la tutela cuando el interruptor 2 está apagado.
 */
export function DerechoPeticion({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <FileText className="size-[18px] shrink-0 text-ambar-500" aria-hidden />
        <h2 className="text-[16px] font-semibold text-texto-consola sm:text-[17px]">
          Derecho de petición, listo para radicar
        </h2>

        <button
          type="button"
          data-boton
          onClick={() => window.print()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ambar-500 px-5 text-[13px] font-semibold text-papel transition hover:bg-ambar-700 sm:ml-auto sm:w-auto sm:justify-start"
        >
          <Printer className="size-4" aria-hidden />
          Imprimir para radicar
        </button>
      </header>

      <article className="documento" lang="es-CO">
        <p className="doc-centro doc-titulo">DERECHO DE PETICIÓN</p>
        <p className="doc-centro doc-norma">
          Artículo 23 de la Constitución Política · Ley 1755 de 2015
        </p>

        <div className="doc-cuerpo">
          <ConMarcas texto={texto} />
        </div>

        <p className="doc-firma">
          Atentamente,
          <br />
          <br />
          <strong>[NOMBRE DEL PETICIONARIO]</strong>
          <br />
          C.C. [NÚMERO]
        </p>

        <p className="doc-pie">
          Documento generado por AMPARO · redacción determinística, sin
          modelo · cada afirmación sale de un hecho verificado del expediente
        </p>
      </article>
    </div>
  );
}
