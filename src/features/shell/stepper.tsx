import Link from 'next/link';
import { Check } from 'lucide-react';

/**
 * Los cuatro pasos del flujo. Numerarlos no es decoración: es lo que permite
 * seguir el razonamiento del motor sin que alguien lo explique al lado.
 *
 * Navegable HACIA ATRÁS únicamente, de solo lectura: "Hechos" y
 * "Procedibilidad" viven en la misma pantalla (`/caso/{id}`), así que ambos
 * apuntan ahí. No se puede saltar adelante — un paso no alcanzado todavía no
 * tiene a dónde ir. Volver atrás no reabre ni recalcula nada: `decidir()` es
 * puro, así que ver la pantalla de análisis de nuevo no cambia una tutela o
 * un certificado ya emitidos.
 */

export const PASOS = ['Entrada', 'Hechos', 'Procedibilidad', 'Resultado'] as const;
export type Paso = (typeof PASOS)[number];

function hrefPara(i: number, casoId?: string): string | undefined {
  if (i === 0) return '/';
  if (!casoId) return undefined;
  if (i === 1 || i === 2) return `/caso/${casoId}`;
  return `/caso/${casoId}/resultado`;
}

/** `tono` cambia el acento del paso activo: verde si avanza, ámbar si enruta. */
export function Stepper({
  activo,
  tono = 'verde',
  casoId,
}: {
  activo: Paso;
  tono?: 'verde' | 'ambar';
  /** Con esto, los pasos ya alcanzados se vuelven links. Sin esto, es solo indicador. */
  casoId?: string;
}) {
  const indiceActivo = PASOS.indexOf(activo);

  const acento =
    tono === 'ambar'
      ? { pill: 'bg-[#C97A2233]', circulo: 'bg-ambar-500', texto: 'text-ambar-300' }
      : { pill: 'bg-[#12735A33]', circulo: 'bg-verde-600', texto: 'text-verde-400' };

  return (
    <ol className="flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3">
      {PASOS.map((paso, i) => {
        const completado = i < indiceActivo;
        const esActivo = i === indiceActivo;
        // Solo hacia atrás: un paso no alcanzado todavía no tiene a dónde ir.
        const href = i <= indiceActivo ? hrefPara(i, casoId) : undefined;

        const contenido = (
          <div
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 ${
              esActivo ? acento.pill : ''
            } ${href ? 'transition hover:bg-[#14201C0D]' : ''}`}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold sm:size-6 sm:text-[11px] ${
                completado || esActivo
                  ? `${esActivo ? acento.circulo : 'bg-verde-600'} text-papel`
                  : 'bg-[#14201C1A] text-texto-consola-3'
              }`}
              aria-hidden
            >
              {completado ? <Check className="size-3 sm:size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`whitespace-nowrap text-[11px] sm:text-[13px] ${
                esActivo
                  ? `font-semibold ${acento.texto}`
                  : completado
                    ? 'text-texto-consola'
                    : 'text-texto-consola-3'
              }`}
            >
              {paso}
              {esActivo && <span className="sr-only"> (paso actual)</span>}
            </span>
          </div>
        );

        return (
          <li key={paso} className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {href ? (
              <Link href={href} aria-label={`Volver a ${paso}`}>
                {contenido}
              </Link>
            ) : (
              contenido
            )}
            {i < PASOS.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-[#14201C1A] sm:w-6" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
