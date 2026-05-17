import { createHash } from 'crypto'
import { cookies } from 'next/headers'

import {
  refreshTokensTable,
  userSessionsTable,
} from './tables'

export async function resolveAuthenticatedUserId(
  supabase: unknown
): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('aprende-y-aplica-session')

  if (sessionCookie?.value) {
    const { data: session } = await userSessionsTable(supabase)
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (session?.user_id) {
      return session.user_id
    }
  }

  return resolveRefreshTokenUserId(supabase, cookieStore)
}

async function resolveRefreshTokenUserId(
  supabase: unknown,
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<string | null> {
  const refreshTokenCookie = cookieStore.get('refresh_token')
  const accessTokenCookie = cookieStore.get('access_token')

  if (!refreshTokenCookie?.value || !accessTokenCookie?.value) {
    return null
  }

  const tokenHash = createHash('sha256')
    .update(refreshTokenCookie.value)
    .digest('hex')

  const { data: refreshToken } = await refreshTokensTable(supabase)
    .select('user_id')
    .eq('token_hash', tokenHash)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  return refreshToken?.user_id ?? null
}
