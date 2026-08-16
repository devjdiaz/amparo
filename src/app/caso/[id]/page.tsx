import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { decidir } from '@/lib/decidir';
import { CASOS } from '@/fixtures/casos';
import { cargarCaso } from '@/lib/caso';
import { fechaCorte } from '@/lib/entorno';
import { Marca } from '@/features/shell/marca';
import { Stepper } from '@/features/shell/stepper';
import { PanelHechos } from '@/features/analisis/hechos';
import { PanelCompuertas } from '@/features/analisis/compuertas';

/**
 * Pantalla 02 · Análisis.
 *
 * Server Component: `decidir()` es puro y no toca la red, así que corre en el
 * servidor sin round-trip. La decisión llega ya tomada al navegador.
 */

export function generateStaticParams() {
  return CASOS.map((c) => ({ id: c.id }));
}

export default async function Analisis({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: params es una Promise.
  const { id } = await params;
  const caso = await cargarCaso(id);
  if (!caso) notFound();

  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: fechaCorte() });
  const enrutando = d.salida !== 'PROCEDE';

  return (
    <main
      className="min-h-dvh"
      style={{
        background:
          'radial-gradient(ellipse 70% 70% at 80% 20%, #12735A0A 0%, #00000000 100%)',
      }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-8 border-b border-[#14201C0D] bg-[#14201C08] px-10 py-4 backdrop-blur-xl">
        <Link href="/" aria-label="Volver al inicio">
          <Marca />
        </Link>
        <Stepper activo="Procedibilidad" tono={enrutando ? 'ambar' : 'verde'} />
      </header>

      <div className="flex items-start gap-6 p-10">
        <PanelHechos transcripcion={caso.transcripcion} hechos={d.hechos} />

        <div className="flex w-[440px] shrink-0 flex-col gap-6">
          <PanelCompuertas proc={d.procedibilidad} />

          <Link
            href={`/caso/${caso.id}/resultado`}
            data-boton
            className={`flex items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold text-papel transition ${
              enrutando ? 'bg-ambar-500 hover:bg-ambar-700' : 'bg-verde-600 hover:bg-verde-700'
            }`}
            style={{
              boxShadow: enrutando ? '0 0 20px #C97A2255' : '0 0 20px #12735A66',
            }}
          >
            {d.salida === 'PROCEDE'
              ? 'Generar la tutela'
              : d.salida === 'NO_PROCEDE'
                ? 'Ver qué sí le sirve hoy'
                : 'Ver qué falta preguntar'}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
