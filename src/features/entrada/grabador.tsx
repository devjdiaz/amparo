'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AudioLines, Loader2, Mic, PenLine, Square, TriangleAlert } from 'lucide-react';

/**
 * La entrada: grabar o escribir.
 *
 * Se ofrecen las dos porque el usuario v1 es el intermediario en una
 * personería, y a veces la persona ya está al lado contando y a veces llegó
 * un mensaje de texto. Escribir no es el modo degradado: es un modo.
 *
 * El estado se muestra paso por paso mientras el servidor trabaja. Son entre
 * 20 y 40 segundos —dos modelos encadenados— y una barra girando sin decir
 * qué pasa se siente rota. Además, esos pasos SON el argumento del producto:
 * verlos avanzar cuenta la historia.
 */

type Fase =
  | { t: 'listo' }
  | { t: 'grabando'; segundos: number }
  | { t: 'enviando'; paso: string }
  | { t: 'error'; mensaje: string };

const PASOS = [
  'Transcribiendo la grabación…',
  'Extrayendo los hechos, con su origen…',
  'Evaluando las cuatro reglas de procedibilidad…',
];

export function Grabador() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>({ t: 'listo' });
  const [texto, setTexto] = useState('');

  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const cronometro = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cronometro.current) clearInterval(cronometro.current);
      grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function empezar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      trozos.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && trozos.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        enviar(new Blob(trozos.current, { type: mr.mimeType || 'audio/webm' }));
      };
      mr.start();
      grabadora.current = mr;

      let s = 0;
      setFase({ t: 'grabando', segundos: 0 });
      cronometro.current = setInterval(() => {
        s += 1;
        setFase({ t: 'grabando', segundos: s });
      }, 1000);
    } catch {
      setFase({
        t: 'error',
        mensaje:
          'No se pudo abrir el micrófono. Revisá los permisos del navegador, o escribí los hechos abajo.',
      });
    }
  }

  function parar() {
    if (cronometro.current) clearInterval(cronometro.current);
    grabadora.current?.stop();
  }

  async function enviar(audio: Blob | null) {
    // Los pasos avanzan solos: el servidor no puede reportar progreso en una
    // sola respuesta, y mentir con una barra que no sabe nada sería peor que
    // decir en qué etapa va el pipeline, que es información real.
    let i = 0;
    setFase({ t: 'enviando', paso: PASOS[0] });
    const avance = setInterval(() => {
      i = Math.min(i + 1, PASOS.length - 1);
      setFase({ t: 'enviando', paso: PASOS[i] });
    }, 9000);

    try {
      const cuerpo = new FormData();
      if (audio) cuerpo.append('audio', audio, 'nota.webm');
      else cuerpo.append('texto', texto);

      const r = await fetch('/api/caso', { method: 'POST', body: cuerpo });
      const datos = await r.json();
      clearInterval(avance);

      if (!r.ok) {
        setFase({ t: 'error', mensaje: datos.error ?? 'Algo salió mal.' });
        return;
      }
      router.push(`/caso/${datos.casoId}`);
    } catch (e) {
      clearInterval(avance);
      setFase({
        t: 'error',
        mensaje: e instanceof Error ? e.message : 'No se pudo conectar.',
      });
    }
  }

  const trabajando = fase.t === 'enviando';

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {/* --- Botón de grabación ------------------------------------------ */}
      <div className="relative grid size-32 place-items-center sm:size-40">
        <div
          className={`absolute inset-0 rounded-full transition-opacity ${
            fase.t === 'grabando' ? 'animate-pulse opacity-100' : 'opacity-60'
          }`}
          style={{ background: 'radial-gradient(circle, #4FB39440 0%, #4FB39400 70%)' }}
          aria-hidden
        />
        <button
          type="button"
          onClick={fase.t === 'grabando' ? parar : empezar}
          disabled={trabajando}
          className={`relative grid size-20 place-items-center rounded-full transition disabled:opacity-50 sm:size-24 ${
            fase.t === 'grabando' ? 'bg-ambar-500 hover:bg-ambar-700' : 'bg-verde-600 hover:bg-verde-700'
          }`}
          style={{
            boxShadow:
              fase.t === 'grabando' ? '0 0 30px #C97A2288' : '0 0 30px #12735A88',
          }}
        >
          {trabajando ? (
            <Loader2 className="size-8 animate-spin text-papel sm:size-10" aria-hidden />
          ) : fase.t === 'grabando' ? (
            <Square className="size-7 text-papel sm:size-8" fill="currentColor" aria-hidden />
          ) : (
            <Mic className="size-8 text-papel sm:size-10" strokeWidth={1.8} aria-hidden />
          )}
          <span className="sr-only">
            {fase.t === 'grabando' ? 'Detener la grabación' : 'Grabar una nota de voz'}
          </span>
        </button>
      </div>

      {/* --- Estado ------------------------------------------------------- */}
      <div className="flex w-full min-h-[76px] flex-col items-center gap-3 text-center">
        {fase.t === 'listo' && (
          <>
            <h1 className="w-full font-serif text-[26px] font-semibold text-texto-consola sm:text-[32px]">
              Cuéntenos su caso
            </h1>
            <p className="w-full max-w-[480px] text-[16px] leading-6 text-texto-consola-3">
              Grabe una nota de voz describiendo lo que pasó. Sin formalidades, en
              sus palabras.
            </p>
          </>
        )}

        {fase.t === 'grabando' && (
          <>
            <p className="w-full font-mono text-[32px] font-semibold text-ambar-300">
              {String(Math.floor(fase.segundos / 60)).padStart(2, '0')}:
              {String(fase.segundos % 60).padStart(2, '0')}
            </p>
            <p className="flex w-full items-center justify-center gap-2 text-[15px] text-texto-consola-2">
              <AudioLines className="size-4 shrink-0" aria-hidden />
              <span>Escuchando. Toque el cuadrado cuando termine.</span>
            </p>
          </>
        )}

        {fase.t === 'enviando' && (
          <>
            <p className="w-full text-[17px] font-semibold text-texto-consola">{fase.paso}</p>
            <p className="w-full max-w-[440px] text-[14px] leading-6 text-texto-consola-3">
              Tarda entre veinte y cuarenta segundos. Cada hecho que salga va a
              quedar con el segundo del audio en que usted lo dijo.
            </p>
          </>
        )}

        {fase.t === 'error' && (
          <div className="flex w-full max-w-[480px] items-start gap-3 rounded-[18px] border border-[#EFB56944] bg-[#C97A2218] p-4 text-left">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ambar-500" aria-hidden />
            <div className="min-w-0">
              <p className="text-[14px] leading-6 text-ambar-300">{fase.mensaje}</p>
              <button
                type="button"
                onClick={() => setFase({ t: 'listo' })}
                className="mt-2 text-[13px] text-verde-400 underline"
              >
                Volver a intentar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Entrada escrita ---------------------------------------------- */}
      {!trabajando && fase.t !== 'grabando' && (
        <>
          <div className="flex w-full max-w-[400px] items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-[#14201C15]" />
            <span className="text-[13px] text-texto-consola-3">o</span>
            <span className="h-px flex-1 bg-[#14201C15]" />
          </div>

          <form
            className="flex w-full max-w-[480px] flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim().length >= 20) enviar(null);
            }}
          >
            <label className="flex items-center gap-3 rounded-[22px] bg-[#14201C0D] px-5 py-3.5 outline outline-[#14201C15] focus-within:outline-verde-400">
              <PenLine className="size-[18px] shrink-0 text-texto-consola-3" aria-hidden />
              <span className="sr-only">Escriba los hechos de su caso</span>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escriba los hechos de su caso aquí..."
                className="w-full bg-transparent text-[15px] text-texto-consola placeholder:text-texto-consola-3 focus:outline-none"
              />
            </label>
            {texto.trim().length > 0 && (
              <button
                type="submit"
                data-boton
                disabled={texto.trim().length < 20}
                className="rounded-full bg-verde-600 px-6 text-[14px] font-semibold text-papel transition hover:bg-verde-700 disabled:opacity-40"
              >
                {texto.trim().length < 20 ? 'Cuente un poco más…' : 'Analizar el caso'}
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
