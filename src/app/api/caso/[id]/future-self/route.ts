/**
 * POST /api/caso/{id}/future-self   foto + audio + mensaje (multipart) → { videoUrl }
 *
 * Orquesta ElevenLabs (clonar la voz, generar el audio del mensaje) y HeyGen
 * (generar el video hablado a partir de la foto y ese audio). Sin llaves, o
 * si cualquier paso falla o tarda demasiado, responde `{ error, fallback:
 * true }` — nunca un 500 que rompa la experiencia. El cliente decide qué
 * hacer con eso: mostrar la pantalla de fallback elegante y seguir a "Tu
 * ruta" de todas formas.
 *
 * Nada de esto se guarda: ni la foto ni la muestra de voz tocan Supabase.
 * Viven en memoria durante esta única petición y desaparecen con ella.
 */

import { NextResponse } from 'next/server';
import { tieneElevenLabs, tieneHeyGen } from '@/lib/entorno';
import { clonarVoz, textoAVoz } from '@/lib/elevenlabs';
import { generarVideoAvatar } from '@/lib/heygen';

// Dos APIs encadenadas, una de ellas con polling: necesita más que el
// default de 10s. 60 es el techo del plan gratuito de Vercel — igual que en
// /api/caso.
export const maxDuration = 60;

const MAX_FOTO = 8 * 1024 * 1024;
const MAX_AUDIO = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!tieneHeyGen() || !tieneElevenLabs()) {
    return NextResponse.json(
      { error: 'Future Self no está configurado todavía.', fallback: true },
      { status: 200 },
    );
  }

  let foto: File | null = null;
  let audio: File | null = null;
  let mensaje = '';

  try {
    const form = await request.formData();
    const f = form.get('foto');
    if (f instanceof File) foto = f;
    const a = form.get('audio');
    if (a instanceof File) audio = a;
    const m = form.get('mensaje');
    if (typeof m === 'string') mensaje = m;
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo debe ser multipart/form-data.', fallback: true },
      { status: 200 },
    );
  }

  if (!foto || !audio || !mensaje) {
    return NextResponse.json(
      { error: 'Falta la foto, el audio o el mensaje.', fallback: true },
      { status: 200 },
    );
  }
  if (foto.size > MAX_FOTO || audio.size > MAX_AUDIO) {
    return NextResponse.json(
      { error: 'El archivo es muy grande.', fallback: true },
      { status: 200 },
    );
  }

  try {
    const fotoBytes = Buffer.from(await foto.arrayBuffer());

    // 1. Clonar la voz y generar el audio del mensaje con ella.
    const voiceId = await clonarVoz(audio, `future-self-${Date.now()}`);
    const audioMensaje = await textoAVoz(voiceId, mensaje);

    // 2. Generar el video: la foto habla el audio recién generado.
    //    42s de margen para el polling, dejando el resto del minuto para
    //    los pasos anteriores y el propio arranque de la función.
    const videoUrl = await generarVideoAvatar(
      fotoBytes,
      foto.type || 'image/jpeg',
      audioMensaje,
      42_000,
    );

    return NextResponse.json({ videoUrl });
  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : String(err);
    console.error('[future-self] no se pudo generar el video:', mensajeError);
    return NextResponse.json({ error: mensajeError, fallback: true }, { status: 200 });
  }
}
