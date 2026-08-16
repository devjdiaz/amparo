'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MessageCircleQuestion, RotateCcw, Send } from 'lucide-react';
import type { PreguntaPendiente } from '../../../motor/compuertas';

/**
 * Cuando el expediente no alcanza, AMPARO no adivina: pregunta.
 *
 * Dos resultados —procede / no procede— son un clasificador. El tercero, "no
 * tengo suficiente para decidir todavía, y estas son las preguntas exactas
 * que me faltan", es lo que separa un demo de algo que alguien pondría en
 * producción. Y esta pantalla es donde esa promesa se vuelve real: responde
 * acá mismo y el motor vuelve a decidir con lo que ya tenía más esto.
 *
 * Los ocho campos que las compuertas pueden pedir son un conjunto cerrado y
 * tipado (siete booleanos, una fecha) — por eso la respuesta se captura con
 * botones Sí/No y un selector de fecha, nunca con un campo de texto libre
 * que un modelo tendría que interpretar. Ni acá se le pide al LLM que
 * adivine qué quiso decir la persona.
 *
 * Es también la razón por la que las compuertas nunca asumen `false` por
 * omisión: en no_temeridad, asumir que no hubo tutela previa podría costarle
 * a la persona una sanción.
 */
export function FaltanDatos({
  casoId,
  esReferencia,
  preguntasDetalle,
}: {
  casoId: string;
  /** Los 4 casos de referencia nunca aceptan escritura: solo se ve el aviso. */
  esReferencia: boolean;
  preguntasDetalle: PreguntaPendiente[];
}) {
  const cantidad = preguntasDetalle.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[28px] border border-[#14201C26] bg-[#14201C0D] p-7">
        <h1 className="font-serif text-[22px] font-semibold text-texto-consola">
          {/* El verbo concuerda con el número: "Me falta un dato" / "Me faltan 3 datos". */}
          {cantidad === 1 ? 'Me falta un dato' : `Me faltan ${cantidad} datos`}{' '}
          para poder decidir
        </h1>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-7 text-texto-consola-2">
          Prefiero preguntarle antes que suponer. Una tutela con un dato inventado
          se la rechaza el juez, y usted pierde el tiempo que vino a ahorrarse.
        </p>
      </section>

      {esReferencia ? (
        <FormularioDeshabilitado />
      ) : (
        <Formulario casoId={casoId} preguntasDetalle={preguntasDetalle} />
      )}

      <p className="flex items-start gap-2 text-[14px] leading-6 text-texto-consola-3">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0" aria-hidden />
        Ninguna de estas preguntas se asume por defecto. En la de tutela previa,
        suponer que no hubo podría costarle una sanción por temeridad.
      </p>
    </div>
  );
}

/** Los 4 casos de referencia son de solo lectura: nunca llaman al endpoint. */
function FormularioDeshabilitado() {
  return (
    <section className="rounded-[18px] border border-[#14201C1A] bg-[#14201C08] p-5">
      <p className="text-[14px] leading-6 text-texto-consola-2">
        Este es un caso de referencia, de solo lectura. En un caso real, acá
        mismo se responden estas preguntas y AMPARO vuelve a decidir.
      </p>
      <Link
        href="/"
        data-boton
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700 sm:w-auto sm:justify-start"
      >
        <RotateCcw className="size-4" aria-hidden />
        Empezar un caso nuevo
      </Link>
    </section>
  );
}

type Respuestas = Record<string, boolean | string>;

function Formulario({
  casoId,
  preguntasDetalle,
}: {
  casoId: string;
  preguntasDetalle: PreguntaPendiente[];
}) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contestadas = Object.keys(respuestas).length;

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        respuestas: preguntasDetalle
          .filter((p) => p.campo in respuestas)
          .map((p) => ({ campo: p.campo, tipoCampo: p.tipoCampo, valor: respuestas[p.campo] })),
      };
      const r = await fetch(`/api/caso/${casoId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const datos = await r.json();
      if (!r.ok) {
        setError(datos.error ?? 'Algo salió mal.');
        setEnviando(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar.');
      setEnviando(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[16px] font-semibold text-texto-consola">
        Respóndame esto y vuelvo a decidir
      </h2>

      <ol className="flex flex-col gap-3">
        {preguntasDetalle.map((p, i) => (
          <li
            key={p.campo}
            className="flex flex-col gap-3 rounded-[18px] bg-[#14201C0D] p-5 outline outline-[#14201C12] sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-start gap-4 sm:flex-1">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[#12735A33] font-mono text-[12px] text-verde-400"
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="pt-1 text-[16px] leading-7 text-texto-consola">{p.pregunta}</p>
            </div>

            {p.tipoCampo === 'booleano' ? (
              <div className="flex shrink-0 gap-2 pl-12 sm:pl-0">
                <BotonSiNo
                  activo={respuestas[p.campo] === true}
                  onClick={() => setRespuestas((r) => ({ ...r, [p.campo]: true }))}
                >
                  Sí
                </BotonSiNo>
                <BotonSiNo
                  activo={respuestas[p.campo] === false}
                  onClick={() => setRespuestas((r) => ({ ...r, [p.campo]: false }))}
                >
                  No
                </BotonSiNo>
              </div>
            ) : (
              <div className="pl-12 sm:pl-0">
                <input
                  type="date"
                  aria-label={p.pregunta}
                  value={typeof respuestas[p.campo] === 'string' ? (respuestas[p.campo] as string) : ''}
                  onChange={(e) =>
                    setRespuestas((r) => ({ ...r, [p.campo]: e.target.value }))
                  }
                  className="rounded-full bg-papel px-4 py-2 text-[14px] text-tinta outline outline-[#14201C22] focus:outline-verde-400"
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-[14px] border border-[#EFB56944] bg-[#C97A2218] p-3 text-[13px] leading-5 text-ambar-300">
          {error}
        </p>
      )}

      <button
        type="button"
        data-boton
        disabled={contestadas === 0 || enviando}
        onClick={enviar}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700 disabled:opacity-40 sm:w-auto sm:justify-start"
      >
        {enviando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        {enviando
          ? 'Guardando…'
          : contestadas === 0
            ? 'Responda al menos una para seguir'
            : `Enviar ${contestadas} de ${preguntasDetalle.length}`}
      </button>
    </section>
  );
}

function BotonSiNo({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-boton
      onClick={onClick}
      aria-pressed={activo}
      className={`min-w-[64px] rounded-full px-5 text-[13px] font-semibold transition ${
        activo
          ? 'bg-verde-600 text-papel'
          : 'bg-[#14201C12] text-texto-consola-2 hover:bg-[#14201C1A]'
      }`}
    >
      {children}
    </button>
  );
}
