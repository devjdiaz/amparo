/**
 * ElevenLabs — Instant Voice Cloning + Text-to-Speech.
 *
 * Las dos llamadas son síncronas: clonar la voz devuelve un `voice_id` en la
 * misma respuesta, y el texto a voz devuelve el audio ya generado en el
 * cuerpo — no hay que hacer polling en ningún lado de este archivo, a
 * diferencia de HeyGen.
 *
 * Server-only. La llave nunca sale de acá.
 */

const BASE = 'https://api.elevenlabs.io';

function llave(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error('Falta ELEVENLABS_API_KEY');
  return k;
}

/** Clona la voz a partir de una muestra corta. Devuelve el voice_id. */
export async function clonarVoz(muestra: Blob, nombre: string): Promise<string> {
  const form = new FormData();
  form.append('name', nombre);
  form.append('files', muestra, 'muestra.webm');
  form.append('remove_background_noise', 'true');

  const r = await fetch(`${BASE}/v1/voices/ivc/create`, {
    method: 'POST',
    headers: { 'xi-api-key': llave() },
    body: form,
  });
  if (!r.ok) {
    throw new Error(`ElevenLabs no pudo clonar la voz: ${r.status} ${await r.text()}`);
  }
  const datos = (await r.json()) as { voice_id: string; requires_verification?: boolean };
  return datos.voice_id;
}

/** Genera el audio del mensaje con la voz clonada. Devuelve el mp3 en bytes. */
export async function textoAVoz(voiceId: string, texto: string): Promise<Buffer> {
  const r = await fetch(`${BASE}/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': llave(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) {
    throw new Error(`ElevenLabs no pudo generar el audio: ${r.status} ${await r.text()}`);
  }
  return Buffer.from(await r.arrayBuffer());
}
