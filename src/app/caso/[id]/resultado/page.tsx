import { notFound } from 'next/navigation';
import Link from 'next/link';
import { decidir } from '@/lib/decidir';
import { redactarDeterministico } from '@/lib/redactor-deterministico';
import { casoPorId, CASOS } from '@/fixtures/casos';
import { fechaCorte } from '@/lib/entorno';
import { valor } from '../../../../../motor/tipos';
import { Marca } from '@/features/shell/marca';
import { Stepper } from '@/features/shell/stepper';
import { VistaResultado } from '@/features/resultado/vista';
import '../../../documento.css';

/**
 * Pantalla 03/04 · Resultado.
 *
 * La decisión se toma en el servidor —`decidir()` es puro— y llega al cliente
 * ya resuelta, junto con las dos redacciones posibles. Los interruptores
 * conmutan sobre eso, sin volver a pedir nada.
 */

export function generateStaticParams() {
  return CASOS.map((c) => ({ id: c.id }));
}

export default async function Resultado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caso = casoPorId(id);
  if (!caso) notFound();

  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: fechaCorte() });
  const enrutando = d.salida !== 'PROCEDE';

  return (
    <main
      className="min-h-dvh"
      style={{
        background: enrutando
          ? 'radial-gradient(ellipse 70% 70% at 30% 70%, #C97A2210 0%, #00000000 100%)'
          : 'radial-gradient(ellipse 70% 70% at 30% 50%, #12735A08 0%, #00000000 100%)',
      }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-8 border-b border-[#FFFFFF0D] bg-[#FFFFFF08] px-10 py-4 backdrop-blur-xl print:hidden">
        <Link href="/" aria-label="Volver al inicio">
          <Marca />
        </Link>
        <Stepper activo="Resultado" tono={enrutando ? 'ambar' : 'verde'} />
      </header>

      <VistaResultado
        datos={{
          casoId: caso.id,
          salida: d.salida,
          procedibilidad: d.procedibilidad,
          recuperacion: d.recuperacion,
          rutas: d.rutas,
          preguntas: d.preguntas,
          // El redactor con modelo entra en el siguiente bloque. Mientras
          // tanto el determinístico cubre los dos lados del interruptor, que
          // es exactamente para lo que existe.
          textoConLlm: null,
          textoSinLlm: redactarDeterministico(caso.expediente, d.fuerza),
          entidad: valor(caso.expediente.entidad) ?? 'la EPS',
          servicio: valor(caso.expediente.servicio) ?? 'el servicio de salud requerido',
        }}
      />
    </main>
  );
}
