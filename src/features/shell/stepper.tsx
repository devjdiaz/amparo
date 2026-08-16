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
    <ol className="flex items-center gap-3">
      {PASOS.map((paso, i) => {
        const completado = i < indiceActivo;
        const esActivo = i === indiceActivo;

        return (
          <li key={paso} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                esActivo ? acento.pill : ''
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  completado || esActivo
                    ? `${esActivo ? acento.circulo : 'bg-verde-600'} text-papel`
                    : 'bg-[#14201C1A] text-texto-consola-3'
                }`}
                aria-hidden
              >
                {completado ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`text-[13px] ${
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
              <span className="h-px w-6 bg-[#14201C1A]" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
