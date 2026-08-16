import Link from 'next/link';
import { MessageCircleQuestion, RotateCcw } from 'lucide-react';

/**
 * Cuando el expediente no alcanza, AMPARO no adivina: pregunta.
 *
 * Dos resultados —procede / no procede— son un clasificador. El tercero, "no
 * tengo suficiente para decidir todavía, y estas son las preguntas exactas
 * que me faltan", es lo que separa un demo de algo que alguien pondría en
 * producción.
 *
 * Es también la razón por la que las compuertas nunca asumen `false` por
 * omisión: en no_temeridad, asumir que no hubo tutela previa podría costarle
 * a la persona una sanción.
 */
export function FaltanDatos({ preguntas }: { preguntas: string[] }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[28px] border border-[#14201C26] bg-[#14201C0D] p-7">
        <h1 className="font-serif text-[22px] font-semibold text-texto-consola">
          {/* El verbo concuerda con el número: "Me falta un dato" / "Me faltan 3 datos". */}
          {preguntas.length === 1
            ? 'Me falta un dato'
            : `Me faltan ${preguntas.length} datos`}{' '}
          para poder escribir su tutela
        </h1>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-7 text-texto-consola-2">
          Prefiero preguntarle antes que suponer. Una tutela con un dato inventado
          se la rechaza el juez, y usted pierde el tiempo que vino a ahorrarse.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold text-texto-consola">
          Esto es lo que falta saber
        </h2>

        <ol className="flex flex-col gap-3">
          {preguntas.map((p, i) => (
            <li
              key={p}
              className="flex items-start gap-4 rounded-[18px] bg-[#14201C0D] p-5 outline outline-[#14201C12]"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[#12735A33] font-mono text-[12px] text-verde-400"
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="pt-1 text-[16px] leading-7 text-texto-consola">{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="flex items-start gap-2 text-[14px] leading-6 text-texto-consola-3">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0" aria-hidden />
        Ninguna de estas preguntas se asume por defecto. En la de tutela previa,
        suponer que no hubo podría costarle una sanción por temeridad.
      </p>

      {/* Todavía no hay formulario para responder acá mismo: hay que volver a
          contar el caso, esta vez incluyendo lo que falta. Decirlo, en vez de
          dejar la pantalla pareciendo un formulario a medio construir. */}
      <section className="rounded-[18px] border border-[#14201C1A] bg-[#14201C08] p-5">
        <p className="text-[14px] leading-6 text-texto-consola-2">
          Por ahora no hay dónde responder esto aquí mismo. Vuelva a grabar o
          escribir su caso, esta vez contando también estos datos.
        </p>
        <Link
          href="/"
          data-boton
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700 sm:w-auto sm:justify-start"
        >
          <RotateCcw className="size-4" aria-hidden />
          Grabar de nuevo, con esto también
        </Link>
      </section>
    </div>
  );
}
