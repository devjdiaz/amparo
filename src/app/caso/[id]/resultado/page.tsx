import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { decidir } from '@/lib/decidir';
import { redactar } from '@/lib/redactor';
import { redactarDeterministico } from '@/lib/redactor-deterministico';
import { CASOS } from '@/fixtures/casos';
import { cargarCaso } from '@/lib/caso';
import { fechaCorte, MODO_FIXTURE } from '@/lib/entorno';
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
  const caso = await cargarCaso(id);
  if (!caso) notFound();

  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: fechaCorte() });
  const enrutando = d.salida !== 'PROCEDE';

  /**
   * El texto del modelo se genera EN EL BUILD y queda horneado en el HTML.
   *
   * Es el precaché, gratis: la página es estática, así que `pnpm build` llama
   * a Claude una vez por caso y lo que se despliega ya trae el texto adentro.
   * El día del demo no se toca la red, la pantalla carga instantánea, y el
   * interruptor 2 conmuta entre dos textos que ya están los dos en el cliente.
   *
   * Si en el build no hay llave o la llamada falla, `redactar()` devuelve el
   * determinístico con su motivo y nada se rompe.
   */
  const redaccion =
    d.salida === 'PROCEDE'
      ? await redactar({
          expediente: caso.expediente,
          memoria: caso.memoria,
          fuerza: d.fuerza,
          recuperacion: d.recuperacion,
          // MODO_FIXTURE decide si el BUILD toca la red.
          //
          //   false → el build llama a Claude y hornea la redacción real.
          //   true  → el build no toca nada; queda el texto determinístico.
          //
          // El segundo existe para que un despliegue pueda salir sin llaves y
          // sin conexión, con el producto completo aunque más feo. Es la misma
          // regla del interruptor 2, aplicada al momento de construir.
          forzarModelo: !MODO_FIXTURE,
        })
      : null;

  return (
    <main
      className="min-h-dvh"
      style={{
        background: enrutando
          ? 'radial-gradient(ellipse 70% 70% at 30% 70%, #C97A2210 0%, #00000000 100%)'
          : 'radial-gradient(ellipse 70% 70% at 30% 50%, #12735A08 0%, #00000000 100%)',
      }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#14201C0D] bg-[#14201C08] px-4 py-3 backdrop-blur-xl print:hidden sm:gap-6 sm:px-6 md:gap-8 md:px-10 md:py-4">
        <Link href="/" aria-label="Volver al inicio" className="shrink-0">
          <Marca />
        </Link>
        <Link
          href="/"
          aria-label="Nuevo caso"
          className="flex shrink-0 items-center gap-1.5 text-[13px] text-texto-consola-2 hover:text-texto-consola"
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Nuevo caso</span>
        </Link>
        <div className="min-w-0 flex-1">
          <Stepper activo="Resultado" tono={enrutando ? 'ambar' : 'verde'} />
        </div>
      </header>

      <VistaResultado
        datos={{
          casoId: caso.id,
          salida: d.salida,
          procedibilidad: d.procedibilidad,
          recuperacion: d.recuperacion,
          rutas: d.rutas,
          preguntas: d.preguntas,
          preguntasDetalle: d.procedibilidad.preguntasDetalle,
          esReferencia: caso.esReferencia,
          // Los dos textos viajan juntos al cliente: conmutar el interruptor
          // no dispara nada, solo cambia cuál se pinta.
          textoConLlm: redaccion?.fuente === 'modelo' ? redaccion.texto : null,
          textoSinLlm: redactarDeterministico(caso.expediente, d.fuerza),
          validacion: redaccion?.validacion ?? null,
          motivoFallback: redaccion?.motivoFallback,
          entidad: valor(caso.expediente.entidad) ?? 'la EPS',
          servicio: valor(caso.expediente.servicio) ?? 'el servicio de salud requerido',
          expediente: caso.expediente,
        }}
      />
    </main>
  );
}
