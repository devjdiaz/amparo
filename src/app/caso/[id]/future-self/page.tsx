import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { decidir } from '@/lib/decidir';
import { cargarCaso } from '@/lib/caso';
import { fechaCorte } from '@/lib/entorno';
import { mensajeFutureSelf } from '@/lib/future-self-mensaje';
import { Marca } from '@/features/shell/marca';
import { ExperienciaFutureSelf } from '@/features/future-self/experiencia';

/**
 * Pantalla Future Self.
 *
 * Vive entre "Procedibilidad" y "Resultado": solo tiene sentido cuando ya
 * hay una decisión (PROCEDE o NO_PROCEDE). Con FALTAN_DATOS todavía no hay
 * un "siguiente paso" que mostrar, así que redirige a terminar de responder.
 *
 * El mensaje se calcula acá, en el servidor, a partir de la misma
 * `Procedibilidad` que ya usa el resto del flujo — nunca lo inventa el
 * cliente ni un modelo en el momento.
 */
export default async function FutureSelfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caso = await cargarCaso(id);
  if (!caso) notFound();

  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: fechaCorte() });

  if (d.salida === 'FALTAN_DATOS') {
    redirect(`/caso/${caso.id}/resultado`);
  }

  const mensaje = mensajeFutureSelf(d.procedibilidad, d.rutas);

  return (
    <main className="min-h-dvh">
      <header className="flex items-center px-4 py-5 sm:px-6 sm:py-7 md:px-10">
        <Link href="/" aria-label="Volver al inicio">
          <Marca />
        </Link>
      </header>

      <ExperienciaFutureSelf casoId={caso.id} mensaje={mensaje} />
    </main>
  );
}
