import { AudioLines } from 'lucide-react';
import { Marca } from '@/features/shell/marca';
import { Grabador } from '@/features/entrada/grabador';

/**
 * Pantalla 01 · Entrada de voz.
 *
 * Son los primeros 8 segundos del video. El usuario no llega emocionado:
 * llega cansado. No hay ilustraciones de gente sonriendo, no hay balanzas
 * ni martillos. Hay un botón grande y una frase corta.
 */

const DATOS = [
  { valor: '312.500', etiqueta: 'tutelas en salud, 2025' },
  { valor: '74,3%', etiqueta: 'tasa de concesión' },
  { valor: '34%', etiqueta: 'del total nacional' },
  { valor: '+162%', etiqueta: 'crecimiento 2020–2025' },
] as const;

export default function Inicio() {
  return (
    <main
      className="relative flex min-h-dvh flex-col"
      style={{
        background:
          'radial-gradient(ellipse 60% 60% at 50% 45%, #12735A18 0%, #00000000 100%)',
      }}
    >
      <header className="flex items-center px-4 py-5 sm:px-6 sm:py-7 md:px-10">
        <Marca />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-12 sm:px-6 sm:pb-16">
        <Grabador />

        <p className="flex w-full items-center justify-center gap-2 px-2 text-center text-[13px] text-texto-consola-3">
          <AudioLines className="size-4 shrink-0" aria-hidden />
          <span>El artículo 86 de la Constitución dice que la tutela no requiere abogado.</span>
        </p>
      </div>

      {/* --- Los datos que sostienen el proyecto ------------------------- */}
      <footer className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-borde-consola px-4 py-5 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-4 sm:px-10 sm:py-7">
        {DATOS.map((d) => (
          <div key={d.etiqueta} className="flex w-full flex-col items-center gap-1 text-center">
            <span className="w-full font-mono text-[16px] font-bold text-verde-400">
              {d.valor}
            </span>
            <span className="w-full text-[12px] text-texto-consola-3">{d.etiqueta}</span>
          </div>
        ))}
      </footer>
    </main>
  );
}
