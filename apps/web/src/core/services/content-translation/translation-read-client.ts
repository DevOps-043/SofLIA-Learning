import { createClient } from '@/lib/supabase/client';
import type { TranslationSupabaseClient } from './types';

/**
 * Cliente de LECTURA de traducciones. Usa el cliente Supabase anon/browser,
 * por lo que es seguro de importar tanto en Server como en Client Components.
 * NO marcar como `server-only`: `load-translations.ts` se ejecuta en el bundle
 * cliente a traves de la cadena de componentes de la pagina de curso.
 */
export function resolveReadClient(
  supabaseClient?: TranslationSupabaseClient,
): TranslationSupabaseClient {
  return supabaseClient ?? (createClient() as TranslationSupabaseClient);
}
