/**
 * GET /api/salud — qué ve el servidor.
 *
 * Reporta si cada variable de entorno EXISTE y qué forma tiene, nunca su
 * valor. Un nombre mal escrito en el panel de despliegue es invisible: la
 * variable simplemente no existe para el código, y el síntoma aparece lejos
 * de la causa —una ruta que se cae, un texto que sale de plantilla— sin decir
 * por qué.
 *
 * `pista` muestra los primeros caracteres del valor solo para poder distinguir
 * "está vacía" de "está mal pegada". Nunca alcanza para reconstruir una llave.
 */

import { NextResponse } from 'next/server';
import { MODO_FIXTURE } from '@/lib/entorno';
import { CORPUS_VERSION } from '@/lib/corpus';
import { pingBase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Prefijo esperado de cada llave, para cazar una pegada en el campo equivocado. */
const ESPERADAS: { nombre: string; empiezaPor?: string }[] = [
  { nombre: 'NEXT_PUBLIC_SUPABASE_URL', empiezaPor: 'https://' },
  { nombre: 'SUPABASE_SECRET_KEY', empiezaPor: 'sb_secret_' },
  { nombre: 'ANTHROPIC_API_KEY', empiezaPor: 'sk-ant-' },
  { nombre: 'OPENAI_API_KEY', empiezaPor: 'sk-' },
  { nombre: 'MODO_FIXTURE' },
  { nombre: 'FECHA_CORTE' },
];

/**
 * Opcionales: Future Self cae al fallback sin ellas, así que su ausencia
 * NUNCA cuenta para `ok`. Van aparte para que nadie las lea como un problema.
 */
const OPCIONALES: { nombre: string; empiezaPor?: string }[] = [
  { nombre: 'HEYGEN_API_KEY' },
  { nombre: 'ELEVENLABS_API_KEY' },
];

export async function GET() {
  const variables = ESPERADAS.map(({ nombre, empiezaPor }) => {
    const v = process.env[nombre];
    return {
      nombre,
      existe: Boolean(v),
      largo: v?.length ?? 0,
      pista: v ? `${v.slice(0, 10)}…` : null,
      formaCorrecta: !v || !empiezaPor ? null : v.startsWith(empiezaPor),
    };
  });

  // Nombres parecidos a los esperados, para cazar el error de tipeo clásico.
  const esperados = new Set([...ESPERADAS, ...OPCIONALES].map((e) => e.nombre));
  const sospechosas = Object.keys(process.env).filter(
    (k) =>
      !esperados.has(k) &&
      /^(NEXT_PUBLIC_SUPA|SUPA|ANT|OPEN|MODO|FECHA|HEY|ELEVEN)/i.test(k),
  );

  const base = await pingBase().catch((e) => ({
    ok: false,
    detalle: e instanceof Error ? e.message : String(e),
  }));

  const opcionales = OPCIONALES.map(({ nombre }) => ({
    nombre,
    existe: Boolean(process.env[nombre]),
  }));

  const faltan = variables.filter((v) => !v.existe).map((v) => v.nombre);
  const malFormadas = variables.filter((v) => v.formaCorrecta === false).map((v) => v.nombre);

  return NextResponse.json({
    ok: faltan.length === 0 && malFormadas.length === 0 && base.ok,
    variables,
    faltan,
    malFormadas,
    /** Variables con nombre PARECIDO al esperado: casi siempre, un typo. */
    sospechosas,
    base,
    modoFixture: MODO_FIXTURE,
    corpus: CORPUS_VERSION,
    node: process.version,
    /** Future Self. Su ausencia no afecta `ok`. */
    opcionales,
    futureSelfActivo: opcionales.every((o) => o.existe),
  });
}
