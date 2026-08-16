/**
 * HeyGen — Photo Avatar (Avatar IV) hablando con un audio ya generado.
 *
 * Verificado en vivo (16 ago 2026, con llave real): subir assets, crear el
 * avatar y generar el video funcionan tal como documentado. Pero generar el
 * video real tardó ~40s — sumado a los pasos previos (clonar voz, texto a
 * voz, dos subidas, crear avatar) se acerca peligrosamente al techo de 60s
 * de una función de Vercel. Por eso el pipeline se parte en dos:
 *
 *   `iniciarVideoAvatar()` — hace todo lo previo y arranca el render, sin
 *   esperarlo. Rápido (~10-15s), cabe con margen en una sola invocación.
 *
 *   `consultarVideo()` — UNA sola consulta de estado, sin loop interno. El
 *   polling vive en el cliente (ver `experiencia.tsx`), que no tiene techo
 *   de 60 segundos.
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

/**
 * Crear el Photo Avatar es asíncrono del lado de HeyGen: el `avatar_id`
 * vuelve con `image_width`/`image_height` en 0 mientras procesa la foto en
 * segundo plano. Pedir el video antes de que termine falla con
 * "missing image dimensions" — verificado en vivo, se resuelve solo unos
 * segundos después. Tres reintentos con espera cubren ese margen sin
 * acercarse al techo de la función.
 */
async function crearVideo(avatarId: string, urlAudio: string): Promise<string> {
  let ultimoError = '';
  for (let intento = 0; intento < 4; intento++) {
    if (intento > 0) await new Promise((r) => setTimeout(r, 3000));

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
    if (r.ok) {
      const datos = (await r.json()) as { data: { video_id: string } };
      return datos.data.video_id;
    }

    const texto = await r.text();
    ultimoError = `${r.status} ${texto}`;
    // Solo reintenta el error de "todavía procesando la foto"; cualquier
    // otro (auth, avatar inválido) no se arregla esperando.
    if (!texto.includes('missing image dimensions')) break;
  }
  throw new Error(`HeyGen no pudo iniciar el video: ${ultimoError}`);
}

export type EstadoVideo =
  | { estado: 'processing' | 'waiting' | 'pending' }
  | { estado: 'completed'; videoUrl: string }
  | { estado: 'failed'; motivo: string };

/** Una sola consulta de estado — sin loop. El loop vive en el cliente. */
export async function consultarVideo(videoId: string): Promise<EstadoVideo> {
  const r = await fetch(`${BASE}/v3/videos/${videoId}`, {
    headers: { 'x-api-key': llave() },
  });
  if (!r.ok) throw new Error(`HeyGen no pudo consultar el video: ${r.status}`);
  const datos = (await r.json()) as {
    data: { status: string; video_url?: string; error?: unknown };
  };
  if (datos.data.status === 'completed' && datos.data.video_url) {
    return { estado: 'completed', videoUrl: datos.data.video_url };
  }
  if (datos.data.status === 'failed') {
    return { estado: 'failed', motivo: JSON.stringify(datos.data.error) };
  }
  return { estado: 'processing' };
}

/**
 * Sube la foto y el audio, crea el avatar, arranca el render. Devuelve el
 * `video_id` sin esperar a que termine — quien llama hace el polling con
 * `consultarVideo()`.
 */
export async function iniciarVideoAvatar(
  foto: Buffer,
  fotoTipo: string,
  audio: Buffer,
): Promise<string> {
  const urlFoto = await subirAsset(foto, fotoTipo);
  const avatarId = await crearAvatarDeFoto(urlFoto);
  const urlAudio = await subirAsset(audio, 'audio/mpeg');
  return crearVideo(avatarId, urlAudio);
}
