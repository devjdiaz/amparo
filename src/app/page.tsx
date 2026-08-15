import { AudioLines, Mic, PenLine } from 'lucide-react';
import { Marca } from '@/features/shell/marca';

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
      <header className="flex items-center px-10 py-7">
        <Marca />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-16">
        {/* --- Botón de grabación --------------------------------------- */}
        <div className="relative grid size-40 place-items-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, #4FB39440 0%, #4FB39400 70%)',
            }}
            aria-hidden
          />
          <button
            type="button"
            className="relative grid size-24 place-items-center rounded-full bg-verde-600 transition hover:bg-verde-700"
            style={{ boxShadow: '0 0 30px #12735A88' }}
          >
            <Mic className="size-10 text-papel" strokeWidth={1.8} aria-hidden />
            <span className="sr-only">Grabar una nota de voz</span>
          </button>
        </div>

        {/* --- Encabezado ------------------------------------------------ */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-[32px] font-semibold text-texto-consola">
            Cuéntenos su caso
          </h1>
          <p className="max-w-[480px] text-[16px] leading-6 text-texto-consola-3">
            Grabe una nota de voz describiendo lo que pasó. Sin formalidades, en
            sus palabras.
          </p>
        </div>

        {/* --- Alternativa por escrito ----------------------------------- */}
        <div className="flex w-[400px] items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-[#FFFFFF15]" />
          <span className="text-[13px] text-texto-consola-3">o</span>
          <span className="h-px flex-1 bg-[#FFFFFF15]" />
        </div>

        <label className="flex w-[480px] items-center gap-3 rounded-[22px] bg-[#FFFFFF0D] px-5 py-3.5 outline outline-[#FFFFFF15]">
          <PenLine className="size-[18px] shrink-0 text-texto-consola-3" aria-hidden />
          <span className="sr-only">Escriba los hechos de su caso</span>
          <input
            type="text"
            placeholder="Escriba los hechos de su caso aquí..."
            className="w-full bg-transparent text-[15px] text-texto-consola placeholder:text-texto-consola-3 focus:outline-none"
          />
        </label>

        <p className="flex items-center gap-2 text-[13px] text-texto-consola-3">
          <AudioLines className="size-4" aria-hidden />
          El artículo 86 de la Constitución dice que la tutela no requiere abogado.
        </p>
      </div>

      {/* --- Los datos que sostienen el proyecto ------------------------- */}
      <footer className="flex justify-center gap-12 border-t border-borde-consola px-10 py-7">
        {DATOS.map((d) => (
          <div key={d.etiqueta} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[16px] font-bold text-verde-400">
              {d.valor}
            </span>
            <span className="text-[12px] text-texto-consola-3">{d.etiqueta}</span>
          </div>
        ))}
      </footer>
    </main>
  );
}
