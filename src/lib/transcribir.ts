/**
 * AMPARO · Transcripción.
 *
 * Paso [1] del flujo: la nota de voz se vuelve texto.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ whisper-1 Y NO UN MODELO MÁS NUEVO
 *
 * Porque `verbose_json` devuelve SEGMENTOS CON MARCA DE TIEMPO, y sin eso la
 * trazabilidad del proyecto sería mentira.
 *
 * Cada hecho del expediente lleva un origen del tipo `audio:00:14`. Si ese
 * número saliera de una estimación —o peor, si lo inventara el extractor— la
 * cadena de custodia sería decorativa: diría "esto lo dijo en el segundo 14"
 * sin que nadie pueda ir a comprobarlo.
 *
 * Con los segmentos reales, el minuto es un dato medido. Alguien puede abrir
 * el audio, saltar a ese punto y escucharlo.
 * ---------------------------------------------------------------------------
 */

import OpenAI from 'openai';
import { tieneOpenAI } from './entorno';

export interface Segmento {
  /** Segundo en que arranca. Es lo que se convierte en `audio:MM:SS`. */
  inicio: number;
  fin: number;
  texto: string;
}

export interface Transcripcion {
  texto: string;
  segmentos: Segmento[];
  duracion: number;
  /** Media de la confianza de Whisper, 0..1. Va al certificado. */
  confianza: number | null;
  fuente: 'whisper' | 'fixture';
}

/** `74.2` → `audio:01:14`. El formato que consume la memoria de hechos. */
export function refDeAudio(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `audio:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Contexto para Whisper. Mejora bastante la transcripción de términos del
 * dominio que un modelo general escribe mal: "EPS", "tutela", "neurología",
 * los nombres de las entidades.
 */
const CONTEXTO =
  'Grabación de una persona en Colombia contando que su EPS le negó un servicio de salud. ' +
  'Puede mencionar: EPS, IPS, tutela, cita con especialista, neurología, oncología, ' +
  'medicamento, autorización, Supersalud, orden médica, historia clínica.';

export async function transcribir(
  audio: File | Blob,
  nombre = 'nota.webm',
): Promise<Transcripcion> {
  if (!tieneOpenAI()) {
    throw new Error(
      'Sin OPENAI_API_KEY configurada: no se puede transcribir. ' +
        'El flujo con fixture no pasa por acá.',
    );
  }

  const cliente = new OpenAI({ timeout: 120_000, maxRetries: 1 });

  const archivo =
    audio instanceof File ? audio : new File([audio], nombre, { type: 'audio/webm' });

  const r = await cliente.audio.transcriptions.create({
    file: archivo,
    model: 'whisper-1',
    language: 'es',
    prompt: CONTEXTO,
    response_format: 'verbose_json',
  });

  // El tipo de `verbose_json` no viene bien estrechado por el SDK.
  const bruto = r as unknown as {
    text: string;
    duration?: number;
    segments?: { start: number; end: number; text: string; avg_logprob?: number }[];
  };

  const segmentos: Segmento[] = (bruto.segments ?? []).map((s) => ({
    inicio: s.start,
    fin: s.end,
    texto: s.text.trim(),
  }));

  // Whisper reporta log-probabilidad media por segmento. Se convierte a algo
  // legible para el certificado — es una señal, no una garantía, y así se
  // presenta en pantalla.
  const logprobs = (bruto.segments ?? [])
    .map((s) => s.avg_logprob)
    .filter((n): n is number => typeof n === 'number');
  const confianza =
    logprobs.length > 0
      ? Math.exp(logprobs.reduce((a, b) => a + b, 0) / logprobs.length)
      : null;

  return {
    texto: bruto.text.trim(),
    segmentos,
    duracion: bruto.duration ?? 0,
    confianza,
    fuente: 'whisper',
  };
}
