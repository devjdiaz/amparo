/**
 * POST /api/caso/{id}/responder   { respuestas } → { ok }
 *
 * La segunda ronda del pipeline: cuando `decidir()` devuelve FALTAN_DATOS,
 * este endpoint es donde entran las respuestas de seguimiento. Sin red, sin
 * modelo — los ocho campos que las compuertas pueden pedir son un conjunto
 * cerrado y tipado (siete booleanos, una fecha), así que capturar la
 * respuesta no necesita que un LLM interprete lenguaje natural. Ese es
 * justo el punto: ni siquiera acá se le pide al modelo que adivine qué
 * quiso decir la persona.
 *
 * El handler valida y llama a lib/. La lógica —whitelist de campos, el
 * Hecho nuevo con su origen, el UPDATE del expediente— vive en
 * `responderCaso()` (src/lib/caso.ts).
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { responderCaso, type RespuestaEnviada } from '@/lib/caso';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let respuestas: RespuestaEnviada[];
  try {
    const body = await request.json();
    if (!Array.isArray(body?.respuestas)) throw new Error('falta el arreglo "respuestas"');
    respuestas = body.respuestas;
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo debe traer { respuestas: [...] }.' },
      { status: 400 },
    );
  }

  if (respuestas.length === 0) {
    return NextResponse.json({ error: 'No mandaste ninguna respuesta.' }, { status: 400 });
  }

  const resultado = await responderCaso(id, respuestas);

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  // El caso cambió: sin esto, `/caso/{id}` y `/caso/{id}/resultado` seguirían
  // sirviendo la versión que Next ya había cacheado de la primera visita.
  revalidatePath(`/caso/${id}`);
  revalidatePath(`/caso/${id}/resultado`);

  return NextResponse.json({ ok: true });
}
