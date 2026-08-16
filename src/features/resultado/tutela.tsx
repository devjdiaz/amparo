import { Download, FileText, Printer } from 'lucide-react';
import type { Candidata } from '../../../motor/recuperador';

/**
 * El documento.
 *
 * Acá se rompe la consola oscura a propósito: la tutela va sobre PAPEL. Es
 * la decisión híbrida del proyecto — la consola es una herramienta de trabajo
 * para el intermediario, pero lo que se radica ante un juez es un documento,
 * y un documento se ve como un documento.
 *
 * Las clases de tipografía y márgenes viven en documento.css, que es CSS
 * plano con @media print. Las utilidades de Tailwind estorban acá: la
 * impresión necesita control fino que no dan.
 */
export function Tutela({
  texto,
  citadas,
  recuperadorActivo,
  redactadoPor,
  entidad,
  servicio,
}: {
  texto: string;
  citadas: Candidata[];
  recuperadorActivo: boolean;
  /**
   * Qué escribió el texto DE VERDAD, no qué dice el interruptor.
   *
   * Son cosas distintas: el interruptor puede estar encendido y el modelo no
   * haber corrido igual —sin llave, sin red, o porque su redacción no pasó la
   * aduana—. El pie de un documento que va ante un juez no puede decir
   * "asistida por modelo" cuando ningún modelo la tocó.
   */
  redactadoPor: 'modelo' | 'deterministica';
  entidad: string;
  servicio: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3 print:hidden">
        <FileText className="size-[18px] text-verde-400" aria-hidden />
        <h1 className="font-serif text-[17px] font-semibold text-texto-consola">
          Tutela lista para radicar
        </h1>

        <span className="ml-auto flex items-center gap-2 rounded-full bg-[#4FB39426] px-3 py-1">
          <span className="size-1.5 rounded-full bg-verde-400" aria-hidden />
          <span className="font-mono text-[11px] text-verde-400">PROCEDE</span>
        </span>

        <button
          type="button"
          data-boton
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-verde-600 px-5 text-[13px] font-semibold text-papel transition hover:bg-verde-700"
        >
          <Printer className="size-4" aria-hidden />
          Descargar para radicar
          <Download className="size-3.5" aria-hidden />
        </button>
      </header>

      {/* --- El papel ---------------------------------------------------- */}
      <article className="documento" lang="es-CO">
        <p className="doc-centro doc-titulo">ACCIÓN DE TUTELA</p>
        <p className="doc-centro doc-norma">
          Artículo 86 de la Constitución Política · Decreto 2591 de 1991
        </p>

        <p className="doc-destinatario">SEÑOR JUEZ DE TUTELA (REPARTO)</p>

        <p>
          <strong>[NOMBRE DEL ACCIONANTE]</strong>, identificado con cédula de
          ciudadanía No. <strong>[NÚMERO]</strong>, residente en{' '}
          <strong>[CIUDAD]</strong>, en ejercicio de la acción de tutela consagrada
          en el artículo 86 de la Constitución Política, acudo ante su despacho
          para solicitar la protección de mi derecho fundamental a la salud,
          vulnerado por <strong>{entidad}</strong> al negarme {servicio}.
        </p>

        {/* El texto redactado: por el modelo, o por plantilla si está apagado. */}
        <div className="doc-cuerpo">
          <ConMarcas texto={texto} />
        </div>

        {citadas.length > 0 && (
          <>
            <h2 className="doc-seccion">II. FUNDAMENTOS DE DERECHO</h2>
            {citadas.map((c) => (
              <p key={c.sentencia.id}>
                La Corte Constitucional, en la{' '}
                <a
                  href={c.sentencia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-cita"
                >
                  Sentencia {c.sentencia.id}
                </a>
                , estableció que {desmayuscular(c.sentencia.subregla)}
              </p>
            ))}
          </>
        )}

        {!recuperadorActivo && (
          <p className="doc-aviso">
            Sin fuente verificable, no se cita. Este escrito se sostiene en los
            hechos y en las normas citadas, sin jurisprudencia de apoyo.
          </p>
        )}

        <h2 className="doc-seccion">III. JURAMENTO</h2>
        <p>
          Bajo la gravedad del juramento manifiesto que no he presentado otra
          acción de tutela por los mismos hechos y derechos.
        </p>

        <p className="doc-firma">
          Atentamente,
          <br />
          <br />
          <strong>[NOMBRE DEL ACCIONANTE]</strong>
          <br />
          C.C. [NÚMERO]
        </p>

        <p className="doc-pie">
          Documento generado por AMPARO ·{' '}
          {redactadoPor === 'modelo'
            ? 'redacción asistida por modelo, auditada frase por frase'
            : 'redacción determinística, sin modelo'} ·
          la decisión de procedibilidad no depende del modelo
        </p>
      </article>
    </div>
  );
}

/** La subregla empieza en mayúscula; dentro de la frase va en minúscula. */
function desmayuscular(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * Pinta las marcas de trazabilidad como superíndices.
 *
 * Las marcas `[#h1]` existen para el validador, no para quien lee. Dejarlas
 * crudas en el documento se ve a medio hacer, y un escrito que va ante un juez
 * no puede verse a medio hacer.
 *
 * Pero borrarlas del todo sería tirar el argumento: que cada afirmación diga
 * de qué hecho salió ES el producto. Así que en pantalla quedan como un
 * superíndice discreto —como la nota al pie de un documento serio— y en papel
 * desaparecen, porque ahí la trazabilidad vive en el certificado adjunto.
 */
function ConMarcas({ texto }: { texto: string }) {
  const trozos = texto.split(/(\[#[a-zA-Z0-9_-]+\])/g);

  return (
    <>
      {trozos.map((t, i) => {
        const marca = /^\[#([a-zA-Z0-9_-]+)\]$/.exec(t);
        if (!marca) return <span key={i}>{t}</span>;
        return (
          <sup key={i} className="doc-marca" title={`Sustentado en el hecho ${marca[1]}`}>
            {marca[1]}
          </sup>
        );
      })}
    </>
  );
}
