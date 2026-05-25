import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Cliente de ESCRITURA de traducciones. Usa la service role key, por lo que
 * SOLO puede ejecutarse en el servidor. El import `server-only` garantiza que
 * un import accidental desde el bundle cliente falle en build, no en runtime.
 */
export function createTranslationWriteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    techDebtLogger.error(
      '[ContentTranslationService] Cannot create write client: missing env vars',
      {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
      },
    );
    return null;
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
