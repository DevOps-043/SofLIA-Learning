import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerCookieAdapter, type SupabaseCookieAdapter } from './cookies'
import { getSupabaseRuntimeConfig } from './config'
import type { Database } from './types'

export async function createAuthActionClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseRuntimeConfig()
  const cookieAdapter = createServerCookieAdapter(cookieStore as unknown as {
    getAll(): ReadonlyArray<{ name: string; value: string }>
    set?(name: string, value: string, options?: Record<string, unknown>): void
  })

  return createServerClient<Database>(url, anonKey, {
    cookies: cookieAdapter as SupabaseCookieAdapter,
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: 'public',
    },
  } as never)
}
