import { ArrowRight, Building2, FilePen, Landmark } from 'lucide-react';
import type { RutaAlterna } from '../../../motor/compuertas';

/**
 * Pantalla del caso improcedente. La decisión de diseño más importante del
 * producto.
 *
 * Va en ÁMBAR, nunca en rojo. Cuando alguien lleva meses peleando con su EPS
 * y por fin encuentra una herramienta que le va a ayudar, un rectángulo rojo
 * que diga "rechazado" le reproduce exactamente la experiencia institucional
 * que lo trajo hasta acá. El rojo queda reservado para cuando falla el
 * sistema, jamás para decirle algo a la persona.
 *
 * Y nunca un no seco: la negativa y la salida van en la misma pantalla, con
 * la razón en lenguaje llano y una fecha concreta para volver.
 */

const ICONO_RUTA = [FilePen, Building2, Landmark];

export function NoProcede({
  rutas,
  motivo,
}: {
  rutas: RutaAlterna[];
  /** El motivo de la compuerta que falló, en lenguaje llano. Sin jerga. */
  motivo: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* --- El no, explicado --------------------------------------------- */}
      <section className="rounded-[28px] border border-ambar-300 bg-[#C97A2218] p-7">
        <h1 className="font-serif text-[22px] font-semibold text-ambar-300">
          Este caso no va por tutela
        </h1>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-7 text-texto-consola">{motivo}</p>
        <p className="mt-2 max-w-[52ch] text-[16px] leading-7 text-texto-consola-2">
          Pero eso no significa que no tenga opciones.
        </p>
      </section>

      {/* --- La salida ---------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-texto-consola">
          Lo que sí le sirve hoy
        </h2>

        {rutas.map((ruta, i) => {
          const Icono = ICONO_RUTA[i % ICONO_RUTA.length];
          // La primera ruta es la que recomendamos: va en ámbar, que es el
          // color de lo que se redirige. Las siguientes en verde, que es el
          // color de lo que avanza.
          const destacada = i === 0;

          return (
            <article
              key={ruta.accion}
              className={`flex flex-wrap items-start gap-4 rounded-[18px] border p-4 sm:p-5 ${
                destacada
                  ? 'border-[#EFB56944] bg-[#C97A2218]'
                  : 'border-[#4FB39444] bg-[#12735A18]'
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${
                  destacada ? 'bg-ambar-500' : 'bg-verde-600'
                }`}
              >
                <Icono className="size-5 text-papel" aria-hidden />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h3 className="text-[15px] font-semibold text-texto-consola">{ruta.accion}</h3>
                <p className="text-[14px] leading-6 text-texto-consola-2">{ruta.comoSeHace}</p>
                {ruta.plazo && (
                  <p className="text-[14px] leading-6 text-ambar-300">{ruta.plazo}</p>
                )}
              </div>

              {ruta.generable && (
                <button
                  type="button"
                  data-boton
                  className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700 sm:ml-auto sm:w-auto sm:self-center"
                >
                  Generar
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              )}
            </article>
          );
        })}
      </section>

      {/*
        La frase que cierra. Es la marca entera en una línea: el sistema no
        cierra la puerta, dice cuándo volver.
      */}
      <p className="text-[14px] leading-6 text-texto-consola-3">
        AMPARO no le cierra la puerta. Le dice cuál es la puerta que sí está abierta
        hoy, y cuándo vale la pena volver.
      </p>
    </div>
  );
}
