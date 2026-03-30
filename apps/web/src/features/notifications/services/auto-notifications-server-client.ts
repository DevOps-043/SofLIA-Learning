/**
 * Shared helper for obtaining a Supabase server client.
 * This module can only be used inside API routes or Server Components.
 */
export async function getServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient can only be used on the server')
  }

  const module = await import('../../../lib/supabase/server')
  return await module.createClient()
}
