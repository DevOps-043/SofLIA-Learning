import { createHash } from 'crypto'
import { cookies } from 'next/headers'

import { refreshTokensTable, userSessionsTable } from './tables'

export async function resolveAuthenticatedUserId(
  authClient: unknown,
  securityClient: unknown = authClient,
): Promise<string | null> {
  const nativeUserId = await resolveNativeAuthUserId(authClient)
  if (nativeUserId) {
    return nativeUserId
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('aprende-y-aplica-session')

  if (sessionCookie?.value) {
    const { data: session } = await userSessionsTable(securityClient)
      .select('user_id')
      .eq('jwt_id', sessionCookie.value)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (session?.user_id) {
      return session.user_id
    }
  }

  return resolveRefreshTokenUserId(securityClient, cookieStore)
}

async function resolveNativeAuthUserId(
  supabase: unknown,
): Promise<string | null> {
  const authClient = supabase as {
    auth?: {
      getUser?: () => Promise<{ data?: { user?: { id?: string } | null } }>
    }
  }

  try {
    const getUser = authClient.auth?.getUser
    if (!getUser) {
      return null
    }

    const { data } = await getUser()
    return data?.user?.id ?? null
  } catch {
    return null
  }
}

async function resolveRefreshTokenUserId(
  supabase: unknown,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
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
