import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { ContentTranslationClient } from './content-translation.types';

interface TranslationServiceEnv {
  serviceKey: string;
  supabaseUrl: string;
}

function getTranslationServiceEnv(): TranslationServiceEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[ContentTranslationService] Missing Supabase service environment');
    console.error('[ContentTranslationService] Required environment state:', {
      hasServiceKey: Boolean(serviceKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
    });
    return null;
  }

  return { serviceKey, supabaseUrl };
}

export function createContentTranslationWriteClient(
  supabaseClient?: ContentTranslationClient
): ContentTranslationClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const env = getTranslationServiceEnv();

  if (!env) {
    return null;
  }

  return createServiceClient<Database>(env.supabaseUrl, env.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
