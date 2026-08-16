'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Panel } from '../shell/panel';

/**
 * Los interruptores de auditoría.
 *
 * Son el corazón de la demostración: un control visible que prueba una
 * afirmación en un segundo vale más que tres párrafos de explicación.
 *
 * Dos reglas de implementación que los hacen funcionar:
 *
 *   1. Conmutan en el CLIENTE, sobre la decisión que ya llegó. Sin round-trip,
 *      sin recarga. Un interruptor que tarda 800 ms no es un interruptor, es
 *      un formulario.
 *   2. El estado apagado NUNCA queda en blanco. Apagar no muestra menos:
 *      muestra la frase que explica por qué no hay nada. El vacío no demuestra
 *      nada; el vacío declarado lo demuestra todo.
 */

export interface EstadoInterruptores {
  recuperadorActivo: boolean;
  llmActivo: boolean;
}

const CONTROLES = [
  {
    clave: 'recuperadorActivo' as const,
    titulo: 'Recuperador de jurisprudencia',
    descripcion: 'Cita sentencias reales, con enlace a la relatoría',
    alApagar: 'El sistema deja de citar en vez de inventar',
  },
  {
    clave: 'llmActivo' as const,
    titulo: 'Modelo de lenguaje',
    descripcion: 'Redacta el documento a partir de los hechos ya verificados',
    alApagar: 'El veredicto sale idéntico: nunca dependió del modelo',
  },
];

export function Interruptores({
  estado,
  onCambio,
}: {
  estado: EstadoInterruptores;
  onCambio: (siguiente: EstadoInterruptores) => void;
}) {
  return (
    <Panel
      icono={<SlidersHorizontal className="size-[18px]" />}
      titulo="Interruptores de auditoría"
    >
      <div className="flex flex-col gap-3">
        {CONTROLES.map((c) => {
          const encendido = estado[c.clave];
          return (
            <div
              key={c.clave}
              className="flex items-start gap-4 rounded-[18px] bg-[#14201C0D] p-4 outline outline-[#14201C12]"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[13px] font-semibold text-texto-consola">{c.titulo}</p>
                <p className="text-[11px] leading-5 text-texto-consola-2">
                  {encendido ? c.descripcion : c.alApagar}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={encendido}
                aria-label={c.titulo}
                onClick={() => onCambio({ ...estado, [c.clave]: !encendido })}
                className={`ml-auto mt-0.5 flex h-[22px] w-10 shrink-0 items-center rounded-full p-[2px] transition-colors ${
                  encendido ? 'bg-verde-400' : 'bg-[#14201C26]'
                }`}
                style={{ minHeight: 22 }}
              >
                <span
                  className={`size-[18px] rounded-full bg-white transition-transform ${
                    encendido ? 'translate-x-[18px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] leading-5 text-texto-consola-3">
        El estado de los dos interruptores queda registrado en el certificado, no
        solo mostrado en pantalla.
      </p>
    </Panel>
  );
}
