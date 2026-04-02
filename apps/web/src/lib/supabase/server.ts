import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseRuntimeConfig } from './config'
import { createServerCookieAdapter, type SupabaseCookieAdapter } from './cookies'
import type { Database } from './types'

/**
 * Server-side Supabase clients must remain request-scoped.
 * Caching client instances by auth cookies is fragile and can leak request
 * context or stale cookie adapters across concurrent renders.
 */

const SERVER_CLIENT_STATS = {
  hits: 0,
  misses: 0,
  hitRate: '0.00%',
  size: 0,
  maxSize: 0,
  cacheKeys: 0,
  mode: 'stateless',
} as const

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseRuntimeConfig()
  const cookieAdapter = createServerCookieAdapter(cookieStore as unknown as {
    getAll(): ReadonlyArray<{ name: string; value: string }>
    set?(name: string, value: string, options?: Record<string, unknown>): void
  })

  return createServerClient<Database>(
    url,
    anonKey,
    ({
      cookies: cookieAdapter as SupabaseCookieAdapter,
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-server-client-pool': 'stateless',
        },
      },
    } as never)
  )
}

/**
 * Kept for observability endpoints that already report pool metrics.
 * The server client is now stateless by design.
 */
export function getServerClientPoolStats() {
  return { ...SERVER_CLIENT_STATS }
}
