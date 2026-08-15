/**
 * Chequeo de arranque: ¿qué está conectado de verdad?
 *   pnpm tsx scripts/salud.ts
 */
import { pingBase } from '../src/lib/supabase';
import { MODO_FIXTURE, tieneAnthropic, tieneOpenAI, tieneSupabase } from '../src/lib/entorno';

const marca = (ok: boolean) => (ok ? '✓' : '✗');

async function main() {
  console.log('');
  console.log(`  ${marca(tieneSupabase())}  Supabase configurado`);
  const base = await pingBase();
  console.log(`  ${marca(base.ok)}  Base responde — ${base.detalle}`);
  console.log(`  ${marca(tieneAnthropic())}  ANTHROPIC_API_KEY (redactor)`);
  console.log(`  ${marca(tieneOpenAI())}  OPENAI_API_KEY (Whisper)`);
  console.log('');
  console.log(
    MODO_FIXTURE
      ? '  MODO_FIXTURE=true  · nada toca la red. Este es el modo de grabación.'
      : '  MODO_FIXTURE=false · se le pega a las APIs reales. Modo desarrollo.',
  );
  console.log('');
}

main();
