'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mic, RotateCcw, Square } from 'lucide-react';

/**
 * Captura de foto y voz. Cámara y micrófono nunca son obligatorios para usar
 * AMPARO — a esta pantalla solo se llega después de un consentimiento
 * explícito, y desde acá también se puede seguir sin cámara.
 *
 * La foto es una sola instantánea (no un video ni un stream que se guarda).
 * La voz es una grabación corta leyendo una frase fija — lo mínimo que pide
 * una clonación instantánea de voz.
 */

const FRASE_VOZ =
  'Ya entiendo mi situación, y estoy listo para dar el siguiente paso.';

export function Captura({
  onListo,
  onCancelar,
}: {
  onListo: (foto: Blob, audio: Blob) => void;
  onCancelar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const intentosFoto = useRef(0);

  const [fase, setFase] = useState<
    | { t: 'iniciando' }
    | { t: 'camara-lista' }
    | { t: 'foto-tomada'; foto: Blob; url: string }
    | { t: 'grabando-voz'; foto: Blob; url: string; segundos: number }
    | { t: 'voz-lista'; foto: Blob; url: string; audio: Blob }
    | { t: 'error'; mensaje: string }
  >({ t: 'iniciando' });

  useEffect(() => {
    let activo = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!activo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setFase({ t: 'camara-lista' });
      })
      .catch(() => {
        setFase({
          t: 'error',
          mensaje: 'No se pudo abrir la cámara. Revisá los permisos del navegador.',
        });
      });

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // El <video> recién se monta cuando la fase pasa a "camara-lista" — antes
  // de eso `videoRef.current` es null, así que asignar `srcObject` dentro
  // del efecto de arriba (que corre una sola vez, al pedir la cámara) llega
  // demasiado temprano y se pierde en silencio. Acá se ata en cuanto el
  // elemento existe.
  useEffect(() => {
    if (fase.t === 'camara-lista' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [fase.t]);

  function tomarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // El elemento <video> puede tener el stream asignado antes de que el
    // navegador termine de leer sus metadatos: `videoWidth`/`videoHeight`
    // llegan en 0 por un instante. Sin esta espera, `canvas.toBlob` produce
    // una imagen de 0×0 y la pantalla se queda muda sin avisar por qué.
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      intentosFoto.current += 1;
      if (intentosFoto.current > 90) {
        // ~1.5s a 60fps sin metadatos: la cámara no va a dar más.
        setFase({
          t: 'error',
          mensaje: 'La cámara no respondió. Probá de nuevo o seguí sin Future Self.',
        });
        return;
      }
      requestAnimationFrame(tomarFoto);
      return;
    }
    intentosFoto.current = 0;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setFase({ t: 'foto-tomada', foto: blob, url: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.92);
  }

  async function empezarVoz() {
    if (fase.t !== 'foto-tomada') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      trozos.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && trozos.current.push(e.data);
      mr.start();
      grabadora.current = mr;

      let s = 0;
      const { foto, url } = fase;
      setFase({ t: 'grabando-voz', foto, url, segundos: 0 });
      const intervalo = setInterval(() => {
        s += 1;
        setFase((f) => (f.t === 'grabando-voz' ? { ...f, segundos: s } : f));
        if (s >= 15) {
          clearInterval(intervalo);
          mr.stop();
        }
      }, 1000);

      mr.onstop = () => {
        clearInterval(intervalo);
        stream.getTracks().forEach((t) => t.stop());
        const audio = new Blob(trozos.current, { type: mr.mimeType || 'audio/webm' });
        setFase({ t: 'voz-lista', foto, url, audio });
      };
    } catch {
      setFase({
        t: 'error',
        mensaje: 'No se pudo abrir el micrófono. Revisá los permisos del navegador.',
      });
    }
  }

  function detenerVoz() {
    grabadora.current?.stop();
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <canvas ref={canvasRef} className="hidden" />

      {fase.t === 'iniciando' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="size-6 animate-spin text-verde-400" aria-hidden />
          <p className="text-[14px] text-texto-consola-3">Abriendo la cámara…</p>
        </div>
      )}

      {fase.t === 'error' && (
        <div className="flex w-full max-w-[440px] flex-col items-center gap-4 rounded-[18px] border border-[#EFB56944] bg-[#C97A2218] p-6">
          <p className="text-[14px] leading-6 text-ambar-300">{fase.mensaje}</p>
          <button
            type="button"
            onClick={onCancelar}
            className="text-[13px] text-verde-400 underline"
          >
            Seguir sin Future Self
          </button>
        </div>
      )}

      {fase.t === 'camara-lista' && (
        <>
          <div className="relative overflow-hidden rounded-[24px] outline outline-2 outline-[#12735A33]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-[320px] w-[280px] -scale-x-100 object-cover sm:h-[360px] sm:w-[320px]"
            />
          </div>
          <p className="max-w-[360px] text-[14px] leading-6 text-texto-consola-3">
            Cuando esté listo, tómese una foto de frente, con buena luz.
          </p>
          <button
            type="button"
            data-boton
            onClick={tomarFoto}
            className="flex items-center gap-2 rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
          >
            <Camera className="size-4" aria-hidden />
            Tomar la foto
          </button>
        </>
      )}

      {(fase.t === 'foto-tomada' || fase.t === 'grabando-voz' || fase.t === 'voz-lista') && (
        <>
          <div className="relative overflow-hidden rounded-[24px] outline outline-2 outline-[#12735A33]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fase.url}
              alt="Su foto para el Future Self"
              className="h-[320px] w-[280px] -scale-x-100 object-cover sm:h-[360px] sm:w-[320px]"
            />
          </div>

          {fase.t === 'foto-tomada' && (
            <>
              <p className="max-w-[380px] text-[14px] leading-6 text-texto-consola-3">
                Ahora una grabación corta. Lea esta frase con calma:
              </p>
              <p className="max-w-[380px] rounded-[14px] bg-[#14201C0D] px-4 py-3 font-serif text-[15px] italic text-texto-consola">
                «{FRASE_VOZ}»
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFase({ t: 'camara-lista' })}
                  className="flex items-center gap-2 rounded-full bg-[#14201C12] px-5 text-[13px] font-semibold text-texto-consola-2 transition hover:bg-[#14201C1A]"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Repetir foto
                </button>
                <button
                  type="button"
                  data-boton
                  onClick={empezarVoz}
                  className="flex items-center gap-2 rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
                >
                  <Mic className="size-4" aria-hidden />
                  Grabar mi voz
                </button>
              </div>
            </>
          )}

          {fase.t === 'grabando-voz' && (
            <>
              <p className="font-mono text-[24px] font-semibold text-ambar-300">
                00:{String(fase.segundos).padStart(2, '0')}
              </p>
              <p className="max-w-[380px] text-[14px] leading-6 text-texto-consola-3">
                «{FRASE_VOZ}»
              </p>
              <button
                type="button"
                data-boton
                onClick={detenerVoz}
                className="flex items-center gap-2 rounded-full bg-ambar-500 px-6 text-[14px] font-semibold text-papel transition hover:bg-ambar-700"
              >
                <Square className="size-3.5" fill="currentColor" aria-hidden />
                Terminar grabación
              </button>
            </>
          )}

          {fase.t === 'voz-lista' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFase({ t: 'camara-lista' })}
                className="flex items-center gap-2 rounded-full bg-[#14201C12] px-5 text-[13px] font-semibold text-texto-consola-2 transition hover:bg-[#14201C1A]"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Empezar de nuevo
              </button>
              <button
                type="button"
                data-boton
                onClick={() => onListo(fase.foto, fase.audio)}
                className="flex items-center gap-2 rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700"
              >
                Crear mi Future Self
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onCancelar}
        className="text-[13px] text-texto-consola-3 underline hover:text-texto-consola-2"
      >
        Seguir sin Future Self
      </button>
    </div>
  );
}
