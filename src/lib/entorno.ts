/**
 * Lectura del entorno en un solo lugar, para que ningún módulo ande leyendo
 * process.env por su cuenta y el valor sea el mismo en todas partes.
 */

/**
 * En true, nada del camino del demo toca la red: transcripción, corpus y
 * redacción salen de fixtures locales.
 *
 * Por defecto está ENCENDIDO. El modo seguro es el que corre el día del
 * evento, y para apagarlo hay que decirlo explícitamente — nadie se acuerda
 * de encenderlo a las 8:50 de la mañana con el video a medio subir.
 */
export const MODO_FIXTURE = process.env.MODO_FIXTURE !== 'false';

/**
 * Fecha de corte de todos los cálculos. La inmediatez se mide en días desde
 * la vulneración: si esto fuera `new Date()` a secas, el caso grabado a las
 * 3am podría dar un veredicto distinto al mediodía. Se congela y se acabó.
 */
export function fechaCorte(): Date {
  const fijada = process.env.FECHA_CORTE;
  return fijada ? new Date(`${fijada}T12:00:00.000Z`) : new Date();
}

export function tieneAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function tieneOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function tieneSupabase(): boolean {
  // Supabase renombró la service_role a sb_secret_*. Se aceptan los dos.
  const secreta =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && secreta);
}

/** Versión del corpus, para que viaje al certificado. */
export const CORPUS_VERSION = process.env.CORPUS_VERSION ?? '2026-08-16';
