import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { TranslationSupabaseClient } from './types';

export function resolveReadClient(
  supabaseClient?: TranslationSupabaseClient,
): TranslationSupabaseClient {
  return supabaseClient ?? (createClient() as TranslationSupabaseClient);
}

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
