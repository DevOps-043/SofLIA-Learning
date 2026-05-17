import { createClient } from '@supabase/supabase-js';

export function getEnv(name: string): string | null {
  return process.env[name] ?? null;
}

export function createAdminClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Supabase env vars not configured');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
