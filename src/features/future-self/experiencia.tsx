'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Camera, Loader2, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { Captura } from './captura';

/**
 * La experiencia completa: CAOS → ESCUCHA → COMPRENSIÓN ya pasaron (son las
 * pantallas de Entrada, Hechos y Procedibilidad). Acá vive el resto:
 * la transición, el consentimiento, la captura, y RUTA → CONTROL → FUTURO.
 *
 * El avatar es el vehículo narrativo, no el producto. Por eso esta pantalla
 * nunca se queda sin salida: con cámara, sin cámara, con las APIs
 * respondiendo o caídas, siempre termina en "Tu ruta".
 */

type Paso =
  | { t: 'transicion'; beat: 0 | 1 | 2 }
  | { t: 'consentimiento' }
  | { t: 'captura' }
  | { t: 'generando' }
  | { t: 'revelado'; videoUrl: string }
  | { t: 'fallback'; motivo?: string };

const BEATS = [
  'Ya entendimos lo que está pasando.',
  'Pero entender su problema es solamente el primer paso.',
  'Ahora mire hacia adelante.',
];

const FRASES_ESPERA = [
  'Estamos preparando una versión de usted que ya conoce su camino…',
  'Esto no analiza cómo se siente. Solo construye cómo se vería con el control de vuelta…',
  'Ya casi. Un poco de paciencia — vale la pena…',
];

export function ExperienciaFutureSelf({
  casoId,
  mensaje,
}: {
  casoId: string;
  mensaje: string;
}) {
  const [paso, setPaso] = useState<Paso>({ t: 'transicion', beat: 0 });

  // Los tres momentos narrativos avanzan solos, con una pausa breve entre
  // cada uno. Cinematográfico, no interactivo: acá no hay nada que decidir
  // todavía.
  useEffect(() => {
    if (paso.t !== 'transicion') return;
    const espera = paso.beat === 0 ? 2200 : 2600;
    const id = setTimeout(() => {
      setPaso((p) =>
        p.t === 'transicion' && p.beat < 2
          ? { t: 'transicion', beat: (p.beat + 1) as 0 | 1 | 2 }
          : { t: 'consentimiento' },
      );
    }, espera);
    return () => clearTimeout(id);
  }, [paso]);

  async function generar(foto: Blob, audio: Blob) {
    setPaso({ t: 'generando' });
    try {
      const cuerpo = new FormData();
      cuerpo.append('foto', foto, 'foto.jpg');
      cuerpo.append('audio', audio, 'voz.webm');
      cuerpo.append('mensaje', mensaje);

      const controlador = new AbortController();
      const limite = setTimeout(() => controlador.abort(), 55_000);

      const r = await fetch(`/api/caso/${casoId}/future-self`, {
        method: 'POST',
        body: cuerpo,
        signal: controlador.signal,
      });
      clearTimeout(limite);

      const datos = await r.json();
      if (r.ok && datos.videoUrl) {
        setPaso({ t: 'revelado', videoUrl: datos.videoUrl });
      } else {
        setPaso({ t: 'fallback', motivo: datos.error });
      }
    } catch {
      setPaso({ t: 'fallback' });
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
      {paso.t === 'transicion' && (
        <p
          key={paso.beat}
          className="max-w-[600px] animate-[aparecer_0.9s_ease-out] text-center font-serif text-[26px] font-semibold leading-tight text-texto-consola sm:text-[34px]"
        >
          {BEATS[paso.beat]}
        </p>
      )}

      {paso.t === 'consentimiento' && (
        <Consentimiento
          onContinuar={() => setPaso({ t: 'captura' })}
          onSaltar={() => setPaso({ t: 'fallback' })}
        />
      )}

      {paso.t === 'captura' && (
        <Captura onListo={generar} onCancelar={() => setPaso({ t: 'fallback' })} />
      )}

      {paso.t === 'generando' && <Generando />}

      {paso.t === 'revelado' && (
        <Revelado casoId={casoId} videoUrl={paso.videoUrl} mensaje={mensaje} />
      )}

      {paso.t === 'fallback' && <FallbackElegante casoId={casoId} />}
    </div>
  );
}

function Consentimiento({
  onContinuar,
  onSaltar,
}: {
  onContinuar: () => void;
  onSaltar: () => void;
}) {
  return (
    <div className="flex w-full max-w-[480px] animate-[aparecer_0.6s_ease-out] flex-col items-center gap-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-[#12735A18]">
        <Camera className="size-6 text-verde-400" aria-hidden />
      </span>
      <h1 className="font-serif text-[24px] font-semibold text-texto-consola">
        Su Future Self
      </h1>
      <p className="text-[16px] leading-7 text-texto-consola-2">
        Para crear su Future Self necesitamos usar temporalmente su imagen y su
        voz. Solo continuamos si usted lo autoriza.
      </p>

      <div className="flex w-full flex-col gap-2.5 rounded-[18px] bg-[#14201C0D] p-4 text-left text-[13px] leading-6 text-texto-consola-2">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verde-400" aria-hidden />
          Su foto y su voz se usan solo para generar este video. No se guardan.
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verde-400" aria-hidden />
          No analizamos su estado de ánimo ni hacemos ningún diagnóstico.
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verde-400" aria-hidden />
          Sin cámara o sin micrófono, AMPARO sigue funcionando igual.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSaltar}
          className="flex-1 rounded-full bg-[#14201C12] px-5 py-3 text-[14px] font-semibold text-texto-consola-2 transition hover:bg-[#14201C1A]"
        >
          No ahora
        </button>
        <button
          type="button"
          data-boton
          onClick={onContinuar}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-verde-600 px-5 py-3 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Generando() {
  const [frase, setFrase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrase((f) => (f + 1) % FRASES_ESPERA.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex animate-[aparecer_0.6s_ease-out] flex-col items-center gap-5 text-center">
      <span className="relative grid size-16 place-items-center">
        <span
          className="absolute inset-0 animate-pulse rounded-full"
          style={{ background: 'radial-gradient(circle, #4FB39440 0%, #4FB39400 70%)' }}
          aria-hidden
        />
        <Loader2 className="size-8 animate-spin text-verde-400" aria-hidden />
      </span>
      <p key={frase} className="max-w-[420px] animate-[aparecer_0.5s_ease-out] text-[16px] leading-7 text-texto-consola-2">
        {FRASES_ESPERA[frase]}
      </p>
    </div>
  );
}

function Revelado({
  casoId,
  videoUrl,
  mensaje,
}: {
  casoId: string;
  videoUrl: string;
  mensaje: string;
}) {
  return (
    <div className="flex w-full max-w-[480px] animate-[aparecer_0.8s_ease-out] flex-col items-center gap-6 text-center">
      <div className="relative overflow-hidden rounded-[28px] shadow-[0_8px_48px_rgba(18,115,90,0.25)]">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full max-w-[360px] rounded-[28px] bg-black"
        />
      </div>
      <p className="max-w-[380px] font-serif text-[19px] italic leading-8 text-texto-consola">
        «{mensaje}»
      </p>
      <TarjetaContinuar casoId={casoId} />
    </div>
  );
}

function FallbackElegante({ casoId }: { casoId: string }) {
  return (
    <div className="flex w-full max-w-[440px] animate-[aparecer_0.6s_ease-out] flex-col items-center gap-5 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-[#12735A18]">
        <Sparkles className="size-6 text-verde-400" aria-hidden />
      </span>
      <p className="text-[18px] leading-7 text-texto-consola">
        Hoy no podemos mostrarle su Future Self.
      </p>
      <p className="text-[15px] leading-7 text-texto-consola-2">
        Pero sí podemos mostrarle su siguiente paso.
      </p>
      <TarjetaContinuar casoId={casoId} />
    </div>
  );
}

function TarjetaContinuar({ casoId }: { casoId: string }) {
  return (
    <Link
      href={`/caso/${casoId}/resultado`}
      data-boton
      className="flex items-center gap-2 rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
    >
      <Play className="size-4" aria-hidden />
      Ver mi ruta
    </Link>
  );
}
