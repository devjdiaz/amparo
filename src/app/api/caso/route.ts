/**
 * POST /api/caso   audio (multipart) → { casoId }
 *
 * El camino en vivo, de punta a punta:
 *
 *   audio → Whisper → segmentos con marca de tiempo
 *         → extractor → hechos anclados a un segundo del audio
 *         → Supabase → el CHECK del esquema rechaza lo que no declare origen
 *         → casoId
 *
 * Es el único sitio donde el pipeline toca la red. Todo lo que viene después
 * —compuertas, fuerza, recuperador, certificado— corre sin red y sin modelo.
 *
 * El handler valida, llama a lib/ y serializa. Cero lógica de negocio acá.
 */

import { NextResponse } from 'next/server';
import { transcribir } from '@/lib/transcribir';
import { extraer } from '@/lib/extraer';
import { supabase } from '@/lib/supabase';
import { fechaCorte } from '@/lib/entorno';

/**
 * El pipeline encadena dos modelos: Whisper (10–20s) y la extracción (15–25s).
 * Con el default de 10s no alcanza ni de cerca.
 *
 * 60 y no más porque ese es el techo del plan gratuito de Vercel: pedir 120
 * ahí no da más tiempo, falla el despliegue. Si el plan sube, esto sube.
 */
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // el límite de la API de Whisper

export async function POST(request: Request) {
  let audio: File | null = null;
  let textoDirecto: string | null = null;

  try {
    const form = await request.formData();
    const a = form.get('audio');
    if (a instanceof File) audio = a;
    const t = form.get('texto');
    if (typeof t === 'string' && t.trim()) textoDirecto = t.trim();
  } catch {
    return NextResponse.json({ error: 'El cuerpo debe ser multipart/form-data.' }, { status: 400 });
  }

  if (!audio && !textoDirecto) {
    return NextResponse.json(
      { error: 'Mandá una grabación o escribí los hechos.' },
      { status: 400 },
    );
  }

  if (audio && audio.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'La grabación es muy larga. El límite son 25 MB.' },
      { status: 413 },
    );
  }

  const hoy = fechaCorte();

  try {
    // --- 1. Transcripción -------------------------------------------------
    // Si escribió en vez de hablar, no hay segmentos: el texto entero cuenta
    // como un solo segmento en el segundo cero, y se declara así.
    const t = audio
      ? await transcribir(audio, audio.name || 'nota.webm')
      : {
          texto: textoDirecto!,
          segmentos: [{ inicio: 0, fin: 0, texto: textoDirecto! }],
          duracion: 0,
          confianza: null,
          fuente: 'fixture' as const,
        };

    if (!t.texto || t.texto.length < 20) {
      return NextResponse.json(
        {
          error:
            'No se entendió la grabación. Volvé a intentarlo hablando un poco más despacio y cerca del micrófono.',
        },
        { status: 422 },
      );
    }

    // --- 2. Extracción ----------------------------------------------------
    const e = await extraer(t.texto, t.segmentos, hoy, audio ? 'audio' : 'escrito');

    if (e.hechos.length === 0) {
      return NextResponse.json(
        {
          error:
            'No se pudo sacar ningún hecho de la grabación. ¿Puede contar qué servicio le negaron y cuándo?',
        },
        { status: 422 },
      );
    }

    // --- 3. Persistencia --------------------------------------------------
    const db = supabase();

    const { data: caso, error: errCaso } = await db
      .from('casos')
      .insert({
        transcripcion: t.texto,
        confianza: t.confianza,
      })
      .select('id')
      .single();

    if (errCaso || !caso) {
      return NextResponse.json(
        { error: `No se pudo guardar el caso: ${errCaso?.message ?? 'sin detalle'}` },
        { status: 500 },
      );
    }

    // La base rechaza cualquier hecho sin origen. Es el invariante, y acá
    // pasa por él todo lo que el extractor produjo.
    const { error: errHechos } = await db.from('hechos').insert(
      e.hechos.map((h) => ({
        caso_id: caso.id,
        ref: h.id,
        contenido: h.contenido,
        origen_tipo: h.origen.tipo,
        origen_ref: h.origen.ref,
        derivado_de: h.origen.derivadoDe ?? [],
      })),
    );

    if (errHechos) {
      return NextResponse.json(
        { error: `Un hecho no pasó el control de origen: ${errHechos.message}` },
        { status: 500 },
      );
    }

    // El expediente se guarda como JSONB: es la vista estructurada, y cada
    // campo ya viaja con el id del hecho que lo sostiene.
    await db.from('casos').update({ audio_url: null }).eq('id', caso.id);
    await db
      .from('decisiones')
      .delete()
      .eq('caso_id', caso.id); // idempotencia si se reintenta

    await guardarExpediente(caso.id, e.expediente);

    return NextResponse.json({
      casoId: caso.id,
      hechos: e.hechos.length,
      sinDato: e.sinDato,
      transcripcion: t.texto,
      confianza: t.confianza,
      duracion: t.duracion,
    });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

/** El expediente vive en `casos.expediente` como JSONB. */
async function guardarExpediente(casoId: string, expediente: unknown) {
  const db = supabase();
  const { error } = await db.from('casos').update({ expediente }).eq('id', casoId);
  if (error) throw new Error(`No se pudo guardar el expediente: ${error.message}`);
}
