import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Única puerta a Postgres.
 *
 * Todo pasa por acá y por el servidor: no hay login ni multi-tenant, así que
 * no se toca RLS y se usa la llave secreta dentro de route handlers. Si algún
 * día hay que cambiar de proveedor, este es el único archivo que se toca.
 */

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase renombró las llaves: sb_secret_* reemplaza a la service_role.
  // Se acepta el nombre viejo por si el entorno viene de otro lado.
  const secreta =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secreta) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY. Revisá .env.local.',
    );
  }

  cliente = createClient(url, secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

/** Para la pantalla de salud y para el arranque: ¿la base responde? */
export async function pingBase(): Promise<{ ok: boolean; detalle: string }> {
  try {
    const { count, error } = await supabase()
      .from('sentencias')
      .select('*', { count: 'exact', head: true });
    if (error) return { ok: false, detalle: error.message };
    return { ok: true, detalle: `${count ?? 0} sentencias en el corpus` };
  } catch (e) {
    return { ok: false, detalle: e instanceof Error ? e.message : String(e) };
  }
}
