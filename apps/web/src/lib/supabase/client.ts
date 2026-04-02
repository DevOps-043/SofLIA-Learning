import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseRuntimeConfig } from './config'
import { createBrowserCookieAdapter, type SupabaseCookieAdapter } from './cookies'
import type { Database } from './types'

/**
 * Crea un cliente de Supabase para el navegador
 * 
 * IMPORTANTE: Este cliente maneja automáticamente las cookies de sesión
 * de Supabase. No uses createBrowserClient() directamente - siempre usa
 * este helper para asegurar que la sesión del usuario se envíe correctamente.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseRuntimeConfig()
  const browserCookieAdapter = createBrowserCookieAdapter(document) as SupabaseCookieAdapter

  return createBrowserClient<Database>(
    url,
    anonKey,
    ({
      // The adapter is implemented in local helpers to make cookie parsing testable.
      // Cast keeps compatibility with the SSR helper's cookie contract.
      cookies: browserCookieAdapter,
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    } as never)
  )
}
