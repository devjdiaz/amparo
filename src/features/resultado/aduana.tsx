import { ShieldCheck, ShieldX } from 'lucide-react';
import { Panel } from '../shell/panel';
import type { Validacion } from '../../../motor/validador';

/**
 * La aduana.
 *
 * Es lo que convierte "no alucinamos" de promesa a prueba. Después de que el
 * modelo escribe, un validador —sin modelo y sin red— comprueba tres cosas:
 *
 *   1. Toda afirmación de hecho declara de qué hecho salió.
 *   2. Ese hecho existe en la memoria.
 *   3. Toda sentencia citada viene del recuperador. Si el recuperador
 *      entregó cero, el texto debe tener cero sentencias.
 *
 * Si algo falla, el texto no se publica tal cual. No hay grado de confianza:
 * hay pasa o no pasa.
 *
 * Este panel existe porque el jurado tiene que poder VER que la comprobación
 * ocurrió. Un chequeo silencioso no demuestra nada.
 */
export function Aduana({
  validacion,
  llmActivo,
  motivoFallback,
}: {
  validacion: Validacion | null;
  llmActivo: boolean;
  motivoFallback?: string;
}) {
  // Interruptor 2 apagado: el texto es de plantilla, no hay nada que auditar.
  if (!llmActivo) {
    return (
      <Panel icono={<ShieldCheck className="size-[18px]" />} titulo="Aduana de redacción">
        <p className="text-[13px] leading-6 text-texto-consola-2">
          El modelo está apagado. El texto sale de una plantilla que se arma con
          los campos del expediente, así que no hay nada que auditar: no hay
          ninguna frase que el sistema no pueda respaldar.
        </p>
        <p className="text-[13px] leading-6 text-verde-400">
          El veredicto de procedibilidad es idéntico. Nunca dependió del modelo.
        </p>
      </Panel>
    );
  }

  if (!validacion) {
    return (
      <Panel icono={<ShieldCheck className="size-[18px]" />} titulo="Aduana de redacción">
        <p className="text-[13px] leading-6 text-texto-consola-2">
          {motivoFallback
            ? `No se usó el modelo: ${motivoFallback} El texto viene de la plantilla determinística.`
            : 'El modelo no corrió para este caso.'}
        </p>
      </Panel>
    );
  }

  const ok = validacion.ok;

  return (
    <Panel
      icono={
        ok ? <ShieldCheck className="size-[18px]" /> : <ShieldX className="size-[18px]" />
      }
      titulo="Aduana de redacción"
      acento={ok ? 'verde' : 'ambar'}
    >
      <ul className="flex flex-col gap-2.5">
        <Chequeo
          ok={validacion.afirmacionesRespaldadas === validacion.afirmaciones}
          texto={`${validacion.afirmacionesRespaldadas} de ${validacion.afirmaciones} afirmaciones declaran de qué hecho salieron`}
        />
        <Chequeo
          ok={validacion.violaciones.every((v) => v.tipo !== 'HECHO_INEXISTENTE')}
          texto="Todos los hechos citados existen en la memoria"
        />
        <Chequeo
          ok={validacion.violaciones.every((v) => v.tipo !== 'CITA_NO_RECUPERADA')}
          texto={
            validacion.sentenciasEnTexto.length === 0
              ? 'El modelo no escribió ninguna sentencia — no es él quien las elige'
              : `Las ${validacion.sentenciasEnTexto.length} sentencias del texto vienen del recuperador`
          }
        />
      </ul>

      {validacion.violaciones.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[18px] border border-[#EFB56944] bg-[#C97A2218] p-4">
          <p className="text-[13px] font-semibold text-ambar-300">
            Se recortaron {validacion.violaciones.length} frases que no pasaron.
          </p>
          {validacion.violaciones.slice(0, 3).map((v, i) => (
            <p key={i} className="text-[11px] leading-5 text-texto-consola-2">
              <span className="font-mono text-ambar-300">{v.tipo}</span> — {v.detalle}
            </p>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-5 text-texto-consola-3">
        Esta comprobación corre sin modelo y sin red. Es código leyendo texto.
      </p>
    </Panel>
  );
}

function Chequeo({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-6">
      {/* Nunca color solo: el símbolo dice lo mismo que el color. */}
      <span className={ok ? 'text-verde-400' : 'text-ambar-300'} aria-hidden>
        {ok ? '✓' : '✗'}
      </span>
      <span className="text-texto-consola-2">
        <span className="sr-only">{ok ? 'Pasa: ' : 'Falla: '}</span>
        {texto}
      </span>
    </li>
  );
}
