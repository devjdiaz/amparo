import { Check } from 'lucide-react';

/**
 * Los cuatro pasos del flujo. Numerarlos no es decoración: es lo que permite
 * seguir el razonamiento del motor sin que alguien lo explique al lado.
 */

export const PASOS = ['Entrada', 'Hechos', 'Procedibilidad', 'Resultado'] as const;
export type Paso = (typeof PASOS)[number];

/** `tono` cambia el acento del paso activo: verde si avanza, ámbar si enruta. */
export function Stepper({
  activo,
  tono = 'verde',
}: {
  activo: Paso;
  tono?: 'verde' | 'ambar';
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

        return (
          <li key={paso} className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 ${
                esActivo ? acento.pill : ''
              }`}
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
            {i < PASOS.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-[#14201C1A] sm:w-6" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
