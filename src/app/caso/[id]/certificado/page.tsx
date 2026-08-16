import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Cpu, FileSearch, Hash, ShieldCheck } from 'lucide-react';
import { decidir } from '@/lib/decidir';
import { casoPorId, CASOS } from '@/fixtures/casos';
import { fechaCorte } from '@/lib/entorno';
import { MODELO } from '@/lib/redactor';
import { Marca } from '@/features/shell/marca';
import { RutaDecision } from '@/features/certificado/ruta';
import { ReglasDeclaradas } from '@/features/certificado/reglas';
import { PanelFuentes, QueNoSeUso } from '@/features/certificado/fuentes';
import { Huella } from '@/features/certificado/huella';

/**
 * Pantalla 05 · Certificado de auditoría.
 *
 * Se emite SIEMPRE: proceda, no proceda o falten datos. Un certificado que
 * solo aparece en el éxito no es auditoría, es marketing.
 */

export function generateStaticParams() {
  return CASOS.map((c) => ({ id: c.id }));
}

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caso = casoPorId(id);
  if (!caso) notFound();

  const d = decidir(caso.expediente, caso.hechos, { casoId: caso.id, hoy: fechaCorte() });
  const c = d.certificado;

  const metadatos = [
    { icono: Hash, etiqueta: 'CASO', valor: c.casoId },
    {
      icono: Calendar,
      etiqueta: 'EMITIDO',
      valor: new Date(c.emitidoEl).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    },
    { icono: Cpu, etiqueta: 'MOTOR', valor: `v${c.motorVersion}` },
    { icono: ShieldCheck, etiqueta: 'REGLAS', valor: c.reglasHash },
    { icono: FileSearch, etiqueta: 'CORPUS', valor: c.corpusVersion },
    // Correcto y explícito: el modelo redacta, y no tiene temperatura porque
    // claude-opus-5 no la acepta. El determinismo del veredicto no viene de
    // ahí de todas formas: viene de que el veredicto no pasa por el modelo.
    { icono: Cpu, etiqueta: 'REDACTOR', valor: MODELO },
  ];

  return (
    <main
      className="min-h-dvh"
      style={{
        background:
          'radial-gradient(ellipse 70% 70% at 70% 30%, #12735A0A 0%, #00000000 100%)',
      }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-[#FFFFFF0D] bg-[#FFFFFF08] px-10 py-4 backdrop-blur-xl">
        <Link href="/" aria-label="Volver al inicio">
          <Marca />
        </Link>
        <Link
          href={`/caso/${caso.id}/resultado`}
          className="flex items-center gap-2 text-[13px] text-texto-consola-2 hover:text-texto-consola"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al resultado
        </Link>
        <span className="ml-auto flex items-center gap-2 rounded-full bg-[#12735A22] px-4 py-1.5">
          <ShieldCheck className="size-4 text-verde-400" aria-hidden />
          <span className="font-mono text-[11px] text-verde-400">Certificado verificable</span>
        </span>
      </header>

      <div className="flex items-start gap-6 p-10">
        {/* --- Columna principal ---------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="rounded-[28px] bg-[#FFFFFF0A] p-7 outline outline-[#FFFFFF12]">
            <h1 className="font-serif text-[22px] font-semibold text-texto-consola">
              Certificado de auditoría
            </h1>
            <p className="mt-2 max-w-[64ch] text-[14px] leading-6 text-texto-consola-2">
              Registro completo de lo que el motor decidió y con qué. Cada paso es
              determinístico y reproducible: con el mismo expediente y las mismas
              reglas, el resultado es idéntico hoy y dentro de un año.
            </p>
            <p className="mt-2 text-[14px] leading-6 text-texto-consola-2">
              Este certificado se emitió con salida{' '}
              <span className="font-mono text-verde-400">{d.salida}</span>. Se emite
              siempre, también cuando la tutela no procede — un certificado que solo
              aparece en el éxito no es auditoría.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {metadatos.map((m) => {
                const Icono = m.icono;
                return (
                  <div key={m.etiqueta} className="rounded-[14px] bg-[#FFFFFF08] p-3.5">
                    <div className="flex items-center gap-2 text-texto-consola-3">
                      <Icono className="size-3.5" aria-hidden />
                      <span className="font-mono text-[9px] tracking-wide">{m.etiqueta}</span>
                    </div>
                    <p className="mt-1.5 break-all font-mono text-[12px] text-texto-consola">
                      {m.valor}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <RutaDecision pasos={d.rutaDecision} />
          <ReglasDeclaradas />
        </div>

        {/* --- Columna de fuentes y huella ------------------------------ */}
        <aside className="flex w-[420px] shrink-0 flex-col gap-6">
          <PanelFuentes recuperacion={d.recuperacion} corpusVencido={d.corpusVencido} />
          <QueNoSeUso
            llmActivo={c.interruptores.llmActivo}
            hayCitas={(d.recuperacion?.citadas.length ?? 0) > 0}
          />
          <Huella certificado={c} />
        </aside>
      </div>
    </main>
  );
}
