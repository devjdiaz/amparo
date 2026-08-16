'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import type { Procedibilidad, RutaAlterna } from '../../../motor/compuertas';
import type { Recuperacion } from '../../../motor/recuperador';
import type { Validacion } from '../../../motor/validador';
import { Aduana } from './aduana';
import { Interruptores, type EstadoInterruptores } from './interruptores';
import { PanelJurisprudencia } from './jurisprudencia';
import { NoProcede } from './no-procede';
import { FaltanDatos } from './faltan-datos';
import { Tutela } from './tutela';

/**
 * La vista de resultado, con los interruptores en vivo.
 *
 * Todo lo que los interruptores pueden mostrar llega YA CALCULADO desde el
 * servidor. Conmutar no dispara ninguna petición: cambia qué se pinta de lo
 * que ya está acá. Por eso el cambio es instantáneo, y por eso funciona
 * delante de un jurado.
 */

export interface DatosResultado {
  casoId: string;
  salida: Procedibilidad['salida'];
  procedibilidad: Procedibilidad;
  recuperacion: Recuperacion | null;
  rutas: RutaAlterna[];
  preguntas: string[];
  /** Texto redactado por el modelo. Null mientras el redactor no exista. */
  textoConLlm: string | null;
  /** Texto de plantilla, sin modelo. Es el que corre si todo falla. */
  textoSinLlm: string;
  /** Qué dijo la aduana sobre el texto del modelo. Null si no corrió. */
  validacion: Validacion | null;
  /** Si se intentó el modelo y no se usó, por qué. Nunca se silencia. */
  motivoFallback?: string;
  /** Datos de encabezado del documento. */
  entidad: string;
  servicio: string;
}

export function VistaResultado({ datos }: { datos: DatosResultado }) {
  const [estado, setEstado] = useState<EstadoInterruptores>({
    recuperadorActivo: true,
    llmActivo: true,
  });

  // Con el recuperador apagado no hay citas: ni en el panel ni en el documento.
  const recuperacionEfectiva = estado.recuperadorActivo ? datos.recuperacion : null;

  // Con el LLM apagado sale el texto determinístico. El veredicto —que ya se
  // calculó arriba, sin modelo— no se mueve ni un milímetro.
  const texto =
    estado.llmActivo && datos.textoConLlm ? datos.textoConLlm : datos.textoSinLlm;

  const motivoFalla =
    datos.procedibilidad.compuertas.find((c) => c.veredicto === 'FALLA')?.motivo ?? '';

  return (
    <div className="flex items-start gap-6 p-10">
      <div className="min-w-0 flex-1">
        {datos.salida === 'PROCEDE' && (
          <Tutela
            texto={texto}
            citadas={recuperacionEfectiva?.citadas ?? []}
            recuperadorActivo={estado.recuperadorActivo}
            llmActivo={estado.llmActivo}
            entidad={datos.entidad}
            servicio={datos.servicio}
          />
        )}
        {datos.salida === 'NO_PROCEDE' && (
          <NoProcede rutas={datos.rutas} motivo={motivoFalla} />
        )}
        {datos.salida === 'FALTAN_DATOS' && <FaltanDatos preguntas={datos.preguntas} />}
      </div>

      <aside className="flex w-[420px] shrink-0 flex-col gap-6">
        {datos.salida === 'PROCEDE' && (
          <PanelJurisprudencia
            recuperacion={recuperacionEfectiva}
            recuperadorActivo={estado.recuperadorActivo}
          />
        )}

        {datos.salida === 'PROCEDE' && (
          <Aduana
            validacion={datos.validacion}
            llmActivo={estado.llmActivo}
            motivoFallback={datos.motivoFallback}
          />
        )}

        <Interruptores estado={estado} onCambio={setEstado} />

        <Link
          href={`/caso/${datos.casoId}/certificado`}
          data-boton
          className="flex items-center justify-center gap-2 rounded-[18px] bg-[#12735A15] px-5 text-[13px] font-semibold text-verde-400 outline outline-[#4FB39433] transition hover:bg-[#12735A25]"
        >
          <FileSearch className="size-4" aria-hidden />
          Ver el certificado de auditoría
        </Link>
      </aside>
    </div>
  );
}
