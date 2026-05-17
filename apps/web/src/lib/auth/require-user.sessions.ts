import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

type CookieStore = Awaited<ReturnType<typeof cookies>>
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function resolveAuthenticatedUserId(
  cookieStore: CookieStore,
  supabase: SupabaseServerClient,
): Promise<string | null> {
  return (
    await resolveLegacySessionUserId(cookieStore, supabase) ??
    await resolveRefreshTokenUserId(cookieStore, supabase)
  )
}

async function resolveLegacySessionUserId(
  cookieStore: CookieStore,
  supabase: SupabaseServerClient,
): Promise<string | null> {
  const sessionCookie = cookieStore.get('aprende-y-aplica-session')
  if (!sessionCookie) {
    return null
  }

  const { data: session } = await supabase
    .from('user_session')
    .select('user_id, expires_at, revoked')
    .eq('jwt_id', sessionCookie.value)
    .single()

  return session && !session.revoked && new Date(session.expires_at) > new Date()
    ? session.user_id
    : null
}

async function resolveRefreshTokenUserId(
  cookieStore: CookieStore,
  supabase: SupabaseServerClient,
): Promise<string | null> {
  const refreshTokenCookie = cookieStore.get('refresh_token')
  const accessTokenCookie = cookieStore.get('access_token')

  if (!refreshTokenCookie || !accessTokenCookie) {
    return null
  }

  const tokenHash = crypto.createHash('sha256').update(refreshTokenCookie.value).digest('hex')
  const { data: tokenData } = await supabase
    .from('refresh_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  return tokenData?.user_id ?? null
}
