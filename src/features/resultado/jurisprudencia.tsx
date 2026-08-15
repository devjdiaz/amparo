import { ExternalLink, Scale, TriangleAlert } from 'lucide-react';
import { Insignia, Panel } from '../shell/panel';
import type { Recuperacion } from '../../../motor/recuperador';

/**
 * La jurisprudencia citada, con enlace vivo a la relatoría de la Corte.
 *
 * El clic que abre la sentencia real es el momento del video: cualquiera
 * puede afirmar que no alucina; abrir la página es demostrarlo.
 *
 * Se muestran también las DESCARTADAS con su motivo y su puntaje. Eso es la
 * mitad del argumento de auditoría: no basta con decir qué se citó, hay que
 * poder ver qué se miró y por qué no entró.
 */
export function PanelJurisprudencia({
  recuperacion,
  recuperadorActivo,
}: {
  recuperacion: Recuperacion | null;
  recuperadorActivo: boolean;
}) {
  // ---------------------------------------------------------------------
  // Interruptor 1 apagado. El vacío NO se deja en blanco: se declara.
  // Un espacio vacío no demuestra nada; un vacío explicado lo demuestra todo.
  // ---------------------------------------------------------------------
  if (!recuperadorActivo) {
    return (
      <Panel
        icono={<Scale className="size-[18px]" />}
        titulo="Jurisprudencia citada"
        insignia={<Insignia acento="ambar">recuperador apagado</Insignia>}
        acento="ambar"
      >
        <div className="flex items-start gap-3 rounded-[18px] border border-[#EFB56944] bg-[#C97A2218] p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ambar-500" aria-hidden />
          <div>
            <p className="text-[14px] font-semibold leading-6 text-ambar-300">
              Sin fuente verificable, no se cita.
            </p>
            <p className="mt-1 text-[13px] leading-6 text-texto-consola-2">
              La tutela sale igual, argumentada con los hechos y las normas, pero
              sin números de sentencia. El sistema deja de citar en vez de inventar.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (!recuperacion) {
    return (
      <Panel icono={<Scale className="size-[18px]" />} titulo="Jurisprudencia citada">
        <p className="text-[13px] leading-6 text-texto-consola-2">
          No se consultó jurisprudencia: las compuertas ya resolvieron el caso.
          Consultar no habría cambiado la decisión.
        </p>
      </Panel>
    );
  }

  const { citadas, descartadas, evaluadas } = recuperacion;

  return (
    <Panel
      icono={<Scale className="size-[18px]" />}
      titulo="Jurisprudencia citada"
      insignia={
        <Insignia acento={citadas.length ? 'verde' : 'ambar'}>
          {citadas.length} de {evaluadas} evaluadas
        </Insignia>
      }
    >
      {/* --- Cero citas es un resultado válido, y se dice ------------------ */}
      {citadas.length === 0 && (
        <div className="rounded-[18px] border border-[#EFB56944] bg-[#C97A2218] p-4">
          <p className="text-[14px] leading-6 text-ambar-300">
            Ninguna sentencia del corpus supera el umbral para este caso, así que no
            se cita ninguna.
          </p>
          <p className="mt-1 text-[13px] leading-6 text-texto-consola-2">
            La tutela va con los argumentos verificados. Preferimos una tutela sin
            jurisprudencia, y decirlo, que una con una sentencia traída de los pelos.
          </p>
        </div>
      )}

      {citadas.map((c) => (
        <article key={c.sentencia.id} className="rounded-[18px] bg-[#FFFFFF0D] p-4">
          <header className="flex items-center gap-2">
            <Scale className="size-4 shrink-0 text-verde-400" aria-hidden />
            <a
              href={c.sentencia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[14px] font-semibold text-verde-400 underline decoration-verde-200 decoration-2 underline-offset-2 hover:text-verde-200"
            >
              {c.sentencia.id}
            </a>
            <ExternalLink className="size-3.5 text-texto-consola-3" aria-hidden />
            <span className="ml-auto font-mono text-[11px] text-texto-consola-3">
              {(c.similitud * 100).toFixed(0)}% de coincidencia
            </span>
          </header>

          <p className="mt-2 text-[13px] leading-6 text-texto-consola-2">{c.sentencia.tema}</p>

          {/* La cita literal. Permite contrastar contra la fuente sin creernos. */}
          {c.sentencia.textual && (
            <blockquote className="mt-3 border-l-2 border-verde-200 pl-3 text-[13px] italic leading-6 text-texto-consola">
              «{c.sentencia.textual}»
            </blockquote>
          )}

          <p className="mt-3 font-mono text-[10px] leading-5 text-texto-consola-3">
            {c.explicacion}
          </p>
          <p className="mt-1 font-mono text-[10px] text-texto-consola-3">
            enlace verificado el {c.sentencia.verificadaEl}
          </p>
        </article>
      ))}

      {/* --- Lo que se miró y NO entró. Nunca se silencia. ----------------- */}
      {descartadas.length > 0 && (
        <details className="rounded-[18px] bg-[#FFFFFF08] p-4">
          <summary className="cursor-pointer text-[12px] text-texto-consola-2">
            {descartadas.length} sentencias evaluadas y descartadas
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {descartadas.map((d) => (
              <li key={d.id} className="flex items-baseline gap-2 text-[11px]">
                <span className="font-mono text-texto-consola-2">{d.id}</span>
                <span className="text-texto-consola-3">{d.motivo}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Panel>
  );
}
