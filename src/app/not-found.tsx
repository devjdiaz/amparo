import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { Marca } from '@/features/shell/marca';

/**
 * 404 propio. Sin esto, un link a un caso que ya no existe (o un typo en la
 * URL) cae en la página en blanco por defecto de Next — sin marca, sin
 * salida. Acá siempre hay un camino de vuelta.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center px-4 py-5 sm:px-6 sm:py-7 md:px-10">
        <Link href="/" aria-label="Volver al inicio">
          <Marca />
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-16 text-center">
        <h1 className="font-serif text-[26px] font-semibold text-texto-consola sm:text-[32px]">
          Este caso no existe, o el enlace ya venció
        </h1>
        <p className="max-w-[440px] text-[16px] leading-6 text-texto-consola-3">
          Puede que el enlace tenga un error, o que el caso se haya generado en
          otra sesión. Empiece uno nuevo.
        </p>
        <Link
          href="/"
          data-boton
          className="mt-2 flex items-center gap-2 rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
        >
          <RotateCcw className="size-4" aria-hidden />
          Empezar un caso nuevo
        </Link>
      </div>
    </main>
  );
}
