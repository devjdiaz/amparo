import { AudioLines, FileText, ListChecks, Sigma } from 'lucide-react';
import { Insignia, Panel } from '../shell/panel';
import type { Hecho, OrigenTipo } from '../../../motor/tipos';

/**
 * Los hechos extraídos, cada uno con su origen a la vista.
 *
 * Esta es la pantalla donde se ve la tesis funcionando: ningún hecho aparece
 * sin decir de dónde salió. No es una lista de bullets — es la evidencia con
 * su cadena de custodia, y por eso el origen se muestra al lado y no en un
 * tooltip.
 */

const ICONO: Record<OrigenTipo, typeof AudioLines> = {
  audio: AudioLines,
  documento: FileText,
  norma: FileText,
  sentencia: FileText,
  derivado: Sigma,
};

const ETIQUETA: Record<OrigenTipo, string> = {
  audio: 'Lo dijo en la grabación',
  documento: 'Documento aportado',
  norma: 'Norma verificada',
  sentencia: 'Sentencia del corpus',
  derivado: 'Calculado por el motor',
};

export function PanelHechos({
  transcripcion,
  hechos,
}: {
  transcripcion: string;
  hechos: Hecho[];
}) {
  return (
    <Panel
      icono={<ListChecks className="size-[18px]" />}
      titulo="Hechos extraídos"
      insignia={<Insignia>{hechos.length} hechos</Insignia>}
      className="flex-1"
    >
      {/* La transcripción cruda, tal como se dijo. */}
      <div className="rounded-[18px] bg-[#FFFFFF08] p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-texto-consola-3">
          <AudioLines className="size-3.5" aria-hidden />
          Transcripción
        </div>
        <p className="text-[14px] leading-6 text-texto-consola-2">…{transcripcion}…</p>
      </div>

      <ol className="flex flex-col gap-3">
        {hechos.map((h, i) => {
          const Icono = ICONO[h.origen.tipo];
          return (
            <li key={h.id} className="flex gap-3 rounded-[18px] bg-[#FFFFFF0D] p-4">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full bg-[#12735A33] font-mono text-[11px] text-verde-400"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-[14px] leading-6 text-texto-consola">{h.contenido}</p>
                <p className="flex flex-wrap items-center gap-2 text-[12px] text-texto-consola-3">
                  <Icono className="size-3.5 shrink-0" aria-hidden />
                  {ETIQUETA[h.origen.tipo]}
                  <span className="font-mono text-verde-400">{h.origen.ref}</span>
                  {h.origen.derivadoDe?.length ? (
                    <span className="text-texto-consola-3">
                      · derivado de {h.origen.derivadoDe.join(', ')}
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-[12px] leading-5 text-texto-consola-3">
        Un hecho sin origen declarado no entra a la memoria, y no lo garantiza el
        código: lo garantiza el esquema de la base de datos.
      </p>
    </Panel>
  );
}
