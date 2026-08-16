/**
 * HeyGen — Photo Avatar (Avatar IV) hablando con un audio ya generado.
 *
 * Tres pasos, dos de ellos asíncronos:
 *   1. Subir la foto como asset → url pública en la CDN de HeyGen.
 *   2. Crear el Photo Avatar a partir de esa foto → avatar_id.
 *   3. Subir el audio como asset, generar el video con ese avatar + audio,
 *      y hacer polling hasta que termine → video_url.
 *
 * NOTA para cuando haya llave real: el endpoint de subida de assets
 * (`upload.heygen.com/v1/asset`) y el de creación de avatar (`/v3/avatars`)
 * son los documentados al momento de escribir esto, pero no se pudieron
 * probar sin API key — si HeyGen devuelve una forma distinta, el error
 * completo queda en el mensaje lanzado, visible en los logs del servidor.
 *
 * Server-only. La llave nunca sale de acá.
 */

const BASE = 'https://api.heygen.com';
const UPLOAD_BASE = 'https://upload.heygen.com';

function llave(): string {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error('Falta HEYGEN_API_KEY');
  return k;
}

async function subirAsset(bytes: Buffer, contentType: string): Promise<string> {
  const r = await fetch(`${UPLOAD_BASE}/v1/asset`, {
    method: 'POST',
    headers: { 'x-api-key': llave(), 'Content-Type': contentType },
    body: new Uint8Array(bytes),
  });
  if (!r.ok) {
    throw new Error(`HeyGen no pudo subir el archivo: ${r.status} ${await r.text()}`);
  }
  const datos = (await r.json()) as { data: { url: string; id: string } };
  return datos.data.url;
}

async function crearAvatarDeFoto(urlFoto: string): Promise<string> {
  const r = await fetch(`${BASE}/v3/avatars`, {
    method: 'POST',
    headers: { 'x-api-key': llave(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'photo',
      name: `future-self-${Date.now()}`,
      file: { type: 'url', url: urlFoto },
    }),
  });
  if (!r.ok) {
    throw new Error(`HeyGen no pudo crear el avatar: ${r.status} ${await r.text()}`);
  }
  const datos = (await r.json()) as { data: { avatar_item: { id: string } } };
  return datos.data.avatar_item.id;
}

async function crearVideo(avatarId: string, urlAudio: string): Promise<string> {
  const r = await fetch(`${BASE}/v3/videos`, {
    method: 'POST',
    headers: { 'x-api-key': llave(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'avatar',
      avatar_id: avatarId,
      audio_url: urlAudio,
      resolution: '1080p',
      aspect_ratio: 'auto',
      motion_prompt: 'hablando con calma, seguridad y serenidad',
      expressiveness: 'medium',
    }),
  });
  if (!r.ok) {
    throw new Error(`HeyGen no pudo iniciar el video: ${r.status} ${await r.text()}`);
  }
  const datos = (await r.json()) as { data: { video_id: string } };
  return datos.data.video_id;
}

async function esperarVideo(videoId: string, limiteMs: number): Promise<string> {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const r = await fetch(`${BASE}/v3/videos/${videoId}`, {
      headers: { 'x-api-key': llave() },
    });
    if (!r.ok) throw new Error(`HeyGen no pudo consultar el video: ${r.status}`);
    const datos = (await r.json()) as {
      data: { status: string; video_url?: string; error?: unknown };
    };
    if (datos.data.status === 'completed' && datos.data.video_url) {
      return datos.data.video_url;
    }
    if (datos.data.status === 'failed') {
      throw new Error(`HeyGen falló generando el video: ${JSON.stringify(datos.data.error)}`);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error('HeyGen tardó más de lo que el demo puede esperar.');
}

/**
 * El pipeline completo: foto + audio ya generado → video final.
 * `limiteMs` acota el polling — quien llama decide cuánto puede esperar.
 */
export async function generarVideoAvatar(
  foto: Buffer,
  fotoTipo: string,
  audio: Buffer,
  limiteMs: number,
): Promise<string> {
  const urlFoto = await subirAsset(foto, fotoTipo);
  const avatarId = await crearAvatarDeFoto(urlFoto);
  const urlAudio = await subirAsset(audio, 'audio/mpeg');
  const videoId = await crearVideo(avatarId, urlAudio);
  return esperarVideo(videoId, limiteMs);
}
