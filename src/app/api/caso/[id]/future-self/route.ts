/**
 * POST /api/caso/{id}/future-self   foto + audio + mensaje (multipart) → { videoId }
 *
 * Orquesta ElevenLabs (clonar la voz, generar el audio del mensaje) y HeyGen
 * (subir foto y audio, crear el avatar, arrancar el render) — pero NO espera
 * a que el video termine. Genera ~40s en HeyGen; esperar acá adentro se
 * acerca demasiado al techo de 60s de una función de Vercel. El cliente hace
 * el polling contra `GET .../future-self/estado?videoId=...`, que no tiene
 * ese techo porque cada consulta es su propia invocación, rápida.
 *
 * Sin llaves, o si cualquier paso falla, responde `{ error, fallback: true
 * }` — nunca un 500 que rompa la experiencia.
 *
 * Nada de esto se guarda: ni la foto ni la muestra de voz tocan Supabase.
 * Viven en memoria durante esta única petición y desaparecen con ella.
 */

import { NextResponse } from 'next/server';
import { tieneElevenLabs, tieneHeyGen } from '@/lib/entorno';
import { clonarVoz, textoAVoz, VOZ_DE_RESERVA } from '@/lib/elevenlabs';
import { iniciarVideoAvatar } from '@/lib/heygen';

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

    // 1. Clonar la voz. Si el plan no incluye Instant Voice Cloning, o la
    //    clonación falla por cualquier otro motivo, el Future Self sigue
    //    existiendo con una voz de reserva en vez de abortar toda la
    //    experiencia — mejor una voz genérica que ningún video.
    let voiceId: string;
    try {
      voiceId = await clonarVoz(audio, `future-self-${Date.now()}`);
    } catch (err) {
      console.error(
        '[future-self] no se pudo clonar la voz, sigue con la de reserva:',
        err instanceof Error ? err.message : String(err),
      );
      voiceId = VOZ_DE_RESERVA;
    }
    const audioMensaje = await textoAVoz(voiceId, mensaje);

    // 2. Arrancar el video en HeyGen. No se espera a que termine acá.
    const videoId = await iniciarVideoAvatar(fotoBytes, foto.type || 'image/jpeg', audioMensaje);

    return NextResponse.json({ videoId });
  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : String(err);
    console.error('[future-self] no se pudo iniciar el video:', mensajeError);
    return NextResponse.json({ error: mensajeError, fallback: true }, { status: 200 });
  }
}
