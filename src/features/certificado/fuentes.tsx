import { Database, ShieldAlert, X } from 'lucide-react';
import { Panel, Insignia } from '../shell/panel';
import type { Recuperacion } from '../../../motor/recuperador';

/**
 * Las fuentes: las que se citaron, y —sobre todo— las que no.
 *
 * Cualquiera muestra lo que usó. Mostrar lo que se miró y se descartó, con el
 * motivo, es lo que separa una auditoría de un adorno. Es también la parte
 * que un jurado puede contrastar: los enlaces abren.
 */
export function PanelFuentes({
  recuperacion,
  corpusVencido,
}: {
  recuperacion: Recuperacion | null;
  corpusVencido: string[];
}) {
  return (
    <Panel
      icono={<Database className="size-[18px]" />}
      titulo="Fuentes consultadas"
      insignia={
        recuperacion ? (
          <Insignia>{recuperacion.evaluadas} evaluadas</Insignia>
        ) : (
          <Insignia acento="neutro">ninguna</Insignia>
        )
      }
    >
      {!recuperacion && (
        <p className="text-[13px] leading-6 text-texto-consola-2">
          No se consultó ninguna fuente. Las compuertas determinísticas ya habían
          resuelto el caso, así que consultar no habría cambiado la decisión —
          habría sido gastar tiempo y plata en un caso ya resuelto.
        </p>
      )}

      {recuperacion && (
        <>
          <p className="font-mono text-[11px] leading-5 text-texto-consola-3">
            consulta: {recuperacion.consulta}
          </p>

          <ul className="flex flex-col gap-2">
            {recuperacion.citadas.map((c) => (
              <li
                key={c.sentencia.id}
                className="flex items-center gap-3 rounded-[14px] bg-[#14201C08] px-3.5 py-2.5"
              >
                <a
                  href={c.sentencia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[12px] text-verde-400 underline decoration-verde-200 decoration-2 underline-offset-2"
                >
                  {c.sentencia.id}
                </a>
                <span className="ml-auto font-mono text-[11px] text-verde-400">Citada</span>
              </li>
            ))}

            {recuperacion.descartadas.map((d) => (
              <li key={d.id} className="rounded-[14px] bg-[#14201C08] px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] text-texto-consola-2">{d.id}</span>
                  <span className="ml-auto font-mono text-[11px] text-texto-consola-3">
                    Evaluada, no citada
                  </span>
                </div>
                {/* El motivo del descarte. Sin esto, "no citada" no dice nada. */}
                <p className="mt-1 text-[11px] leading-5 text-texto-consola-3">{d.motivo}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {corpusVencido.length > 0 && (
        <p className="rounded-[14px] border border-[#EFB56944] bg-[#C97A2218] p-3 text-[11px] leading-5 text-ambar-300">
          Sin verificar hace más de 30 días: {corpusVencido.join(', ')}. Se declara
          en vez de disimularlo.
        </p>
      )}
    </Panel>
  );
}

/**
 * El espacio negativo.
 *
 * Es la mitad del argumento del proyecto, y por eso tiene su propio panel en
 * vez de ser una nota al pie. Lo que el sistema NO hizo es tan verificable
 * como lo que hizo.
 */
export function QueNoSeUso({
  llmActivo,
  hayCitas,
}: {
  llmActivo: boolean;
  hayCitas: boolean;
}) {
  const puntos = [
    'El modelo no eligió las citas: no tiene un campo donde ponerlas',
    'El modelo no decidió si la tutela procede',
    'No se consultó ninguna fuente fuera del corpus verificado',
    'No se entrenó nada con los datos de esta persona',
    'No se usó temperatura ni muestreo aleatorio: el mismo caso da el mismo resultado',
    ...(hayCitas ? [] : ['No se citó ninguna sentencia, y el documento lo dice']),
    ...(llmActivo ? [] : ['El modelo no participó en este documento en absoluto']),
  ];

  return (
    <Panel icono={<ShieldAlert className="size-[18px]" />} titulo="Qué NO se usó">
      <ul className="flex flex-col gap-2.5">
        {puntos.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[13px] leading-6">
            <X className="mt-1 size-3.5 shrink-0 text-ambar-300" strokeWidth={3} aria-hidden />
            <span className="text-texto-consola-2">{p}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
