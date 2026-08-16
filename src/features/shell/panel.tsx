import type { ReactNode } from 'react';

/**
 * Panel de la consola. Vidrio sobre negro, como el mockup.
 *
 * `insignia` es para el contador que va al lado del título ("4 hechos",
 * "1 citada de 4 evaluadas"): dice el tamaño de lo que se está mirando sin
 * que haya que contarlo.
 */
export function Panel({
  icono,
  titulo,
  insignia,
  acento = 'verde',
  className = '',
  children,
}: {
  icono?: ReactNode;
  titulo: string;
  insignia?: ReactNode;
  acento?: 'verde' | 'ambar';
  className?: string;
  children: ReactNode;
}) {
  const color = acento === 'ambar' ? 'text-ambar-300' : 'text-verde-400';

  return (
    <section
      className={`flex flex-col gap-5 rounded-[28px] bg-[#14201C0A] p-6 outline outline-[#14201C12] ${className}`}
    >
      <header className="flex items-center gap-3">
        {icono && <span className={`shrink-0 ${color}`}>{icono}</span>}
        <h2 className="font-serif text-[17px] font-semibold text-texto-consola">{titulo}</h2>
        {insignia && <div className="ml-auto">{insignia}</div>}
      </header>
      {children}
    </section>
  );
}

/** Contador en pastilla. */
export function Insignia({
  children,
  acento = 'verde',
}: {
  children: ReactNode;
  acento?: 'verde' | 'ambar' | 'neutro';
}) {
  const estilos = {
    verde: 'bg-[#12735A33] text-verde-400',
    ambar: 'bg-[#C97A2226] text-ambar-300',
    neutro: 'bg-[#14201C12] text-texto-consola-2',
  }[acento];

  return (
    <span className={`rounded-full px-3 py-1 font-mono text-[11px] ${estilos}`}>{children}</span>
  );
}

/**
 * Tarjeta interna. `estado` pinta el borde, pero NUNCA solo con color: quien
 * la use tiene que poner además texto o ícono. Hay usuarios daltónicos y hay
 * pantallas destrozadas por el sol.
 */
export function Tarjeta({
  estado = 'neutro',
  className = '',
  children,
}: {
  estado?: 'pasa' | 'falla' | 'duda' | 'neutro';
  className?: string;
  children: ReactNode;
}) {
  const borde = {
    pasa: 'outline-[#4FB39444]',
    falla: 'outline-[#EFB56944]',
    duda: 'outline-[#14201C22]',
    neutro: 'outline-[#14201C12]',
  }[estado];

  return (
    <div className={`rounded-[18px] bg-[#14201C0D] p-4 outline ${borde} ${className}`}>
      {children}
    </div>
  );
}
