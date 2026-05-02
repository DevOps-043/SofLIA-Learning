import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LoadTestConfig } from './types';
import { requireSupabaseConfig } from './config';

export type AdminSupabaseClient = SupabaseClient<any>;

export function createAdminSupabase(config: LoadTestConfig): AdminSupabaseClient {
  requireSupabaseConfig(config);

  return createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-soflia-load-test': config.runId,
      },
    },
  });
}

export async function safeInsert(
  supabase: AdminSupabaseClient,
  tableName: string,
  rows: Array<Record<string, unknown>>,
  warnings: string[],
) {
  if (rows.length === 0) return;

  const { error } = await (supabase.from(tableName) as any).insert(rows);
  if (error) {
    warnings.push(`Optional seed insert skipped for ${tableName}: ${error.message}`);
  }
}

export async function safeDeleteIn(
  supabase: AdminSupabaseClient,
  tableName: string,
  column: string,
  values: string[],
  warnings: string[],
) {
  if (values.length === 0) return;

  for (let index = 0; index < values.length; index += 100) {
    const chunk = values.slice(index, index + 100);
    const { error } = await (supabase.from(tableName) as any).delete().in(column, chunk);
    if (error) {
      warnings.push(`Cleanup skipped for ${tableName}.${column}: ${error.message}`);
      return;
    }
  }
}

export async function safeDeleteEq(
  supabase: AdminSupabaseClient,
  tableName: string,
  column: string,
  value: string,
  warnings: string[],
) {
  const { error } = await (supabase.from(tableName) as any).delete().eq(column, value);
  if (error) {
    warnings.push(`Cleanup skipped for ${tableName}.${column}: ${error.message}`);
  }
}
