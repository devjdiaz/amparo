import { Scale } from 'lucide-react';
import { Panel } from '../shell/panel';
import { reglasEnLista } from '../../lib/reglas';

/**
 * Los números del motor, a la vista y con su fundamento.
 *
 * Este panel es el argumento de explicabilidad hecho interfaz. Un scorecard de
 * pesos declarados se puede leer, discutir y cambiar; un modelo entrenado no.
 * En este dominio eso no es una virtud: es un requisito.
 *
 * Cada número dice de dónde sale. Un umbral sin fundamento es una opinión
 * disfrazada de código, y acá se nota cuáles son norma, cuáles son
 * jurisprudencia y cuáles son decisión de producto — que también es una
 * respuesta legítima, siempre que se declare.
 */
export function ReglasDeclaradas() {
  const reglas = reglasEnLista();

  return (
    <Panel
      icono={<Scale className="size-[18px]" />}
      titulo="Las reglas, con su fundamento"
    >
      <ul className="flex flex-col gap-3">
        {reglas.map((r) => (
          <li key={r.etiqueta} className="rounded-[14px] bg-[#14201C08] p-3.5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[15px] font-bold text-verde-400">
                {r.valor}
              </span>
              <span className="text-[13px] font-semibold text-texto-consola">
                {r.etiqueta}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-texto-consola-2">
              {r.fundamento}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-[11px] leading-5 text-texto-consola-3">
        Estos números no salieron de entrenar nada. Están escritos a mano, viven en
        un solo archivo y se pueden discutir. La huella del certificado los incluye:
        dos decisiones tomadas con reglas distintas no se pueden confundir.
      </p>
    </Panel>
  );
}
