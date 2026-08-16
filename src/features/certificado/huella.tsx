'use client';

import { useState } from 'react';
import { ScanLine, ShieldCheck, ShieldX } from 'lucide-react';
import type { Certificado } from '../../../motor/certificado';
import { verificarHuellaWeb } from '../../../motor/huella-web';

/**
 * La huella, y el botón que la comprueba delante de quien mira.
 *
 * Un sello que solo el emisor puede verificar no es un sello: es una etiqueta.
 * Acá el navegador recalcula el SHA-256 sobre el mismo JSON canónico y compara.
 * Si alguien editara una sola coma del certificado, la huella cambiaría y el
 * botón lo diría.
 *
 * Lo que NO es, y hay que decirlo en voz alta: no es una firma criptográfica.
 * No hay clave privada de por medio. Prueba integridad, no autoría.
 */
export function Huella({ certificado }: { certificado: Certificado }) {
  const [estado, setEstado] = useState<
    { fase: 'inicial' } | { fase: 'verificando' } | { fase: 'listo'; ok: boolean; recalculada: string }
  >({ fase: 'inicial' });

  async function verificar() {
    setEstado({ fase: 'verificando' });
    const r = await verificarHuellaWeb(certificado);
    setEstado({ fase: 'listo', ok: r.ok, recalculada: r.recalculada });
  }

  const ok = estado.fase === 'listo' ? estado.ok : null;

  return (
    <section
      className={`flex flex-col gap-4 rounded-[28px] border p-6 ${
        ok === false
          ? 'border-[#A32D2D] bg-[#A32D2D18]'
          : 'border-[#4FB39444] bg-[#12735A18]'
      }`}
    >
      <header className="flex items-center gap-3">
        <ScanLine className="size-[18px] text-verde-400" aria-hidden />
        <h2 className="font-serif text-[17px] font-semibold text-texto-consola">
          Integridad del documento
        </h2>
      </header>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-texto-consola-3">
          SHA-256
        </p>
        <p className="mt-1 break-all font-mono text-[12px] leading-5 text-verde-400">
          {certificado.huella}
        </p>
      </div>

      {estado.fase === 'listo' && (
        <div
          className={`flex items-start gap-2.5 rounded-[14px] p-3 ${
            estado.ok ? 'bg-[#4FB39418]' : 'bg-[#A32D2D22]'
          }`}
        >
          {estado.ok ? (
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verde-400" aria-hidden />
          ) : (
            <ShieldX className="mt-0.5 size-4 shrink-0 text-[#A32D2D]" aria-hidden />
          )}
          <div className="min-w-0">
            <p
              className={`text-[13px] font-semibold ${
                estado.ok ? 'text-verde-400' : 'text-[#A32D2D]'
              }`}
            >
              {estado.ok
                ? 'Verificado en este navegador, recién.'
                : 'La huella NO coincide. El certificado fue alterado.'}
            </p>
            {!estado.ok && (
              <p className="mt-1 break-all font-mono text-[10px] text-texto-consola-2">
                recalculada: {estado.recalculada}
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        data-boton
        onClick={verificar}
        disabled={estado.fase === 'verificando'}
        className="rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700 disabled:opacity-60"
      >
        {estado.fase === 'verificando' ? 'Calculando…' : 'Recalcular la huella acá mismo'}
      </button>

      <p className="text-[11px] leading-5 text-texto-consola-3">
        El navegador vuelve a calcular el hash sobre el mismo contenido y lo compara.
        No es una firma criptográfica y no pretende serlo: no hay clave privada de por
        medio. Prueba que el documento no fue alterado, no quién lo emitió.
      </p>
    </section>
  );
}
