/**
 * GET /api/caso/{id}/future-self/estado?videoId=...   → { estado, videoUrl? }
 *
 * Una sola consulta a HeyGen, sin loop — el cliente es quien repite esta
 * llamada cada pocos segundos. Así ninguna invocación se acerca al techo de
 * 60s de Vercel, sin importar cuánto tarde HeyGen en terminar.
 */

import { NextResponse } from 'next/server';
import { consultarVideo } from '@/lib/heygen';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'Falta videoId.', fallback: true }, { status: 200 });
  }

  try {
    const r = await consultarVideo(videoId);
    if (r.estado === 'completed') {
      return NextResponse.json({ estado: 'completed', videoUrl: r.videoUrl });
    }
    if (r.estado === 'failed') {
      console.error('[future-self] HeyGen falló generando el video:', r.motivo);
      return NextResponse.json({ estado: 'failed', fallback: true });
    }
    return NextResponse.json({ estado: 'processing' });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error('[future-self] no se pudo consultar el video:', mensaje);
    return NextResponse.json({ error: mensaje, fallback: true }, { status: 200 });
  }
}
