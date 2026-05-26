import type { createClient } from '@/lib/supabase/server'
import { authFailure, authSuccess } from './result'
import type { AuthResult } from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface CookieStoreLike {
  get(name: string): { value: string } | undefined
}

export interface SessionMessages {
  missingSession: string
  invalidSession: string
  revokedSession: string
  expiredSession: string
}

export interface AuthLoggerLike {
  debug(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
}

export interface ResolveAuthenticatedUserIdDependencies {
  cookieStore: CookieStoreLike
  supabase: SupabaseClient
  logger: AuthLoggerLike
  logPrefix: string
  messages: SessionMessages
  hashToken?: (token: string) => Promise<string>
  now?: () => Date
}

async function defaultHashToken(token: string): Promise<string> {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function resolveAuthenticatedUserId(
  dependencies: ResolveAuthenticatedUserIdDependencies,
): Promise<AuthResult<string>> {
  const {
    cookieStore,
    supabase,
    logger,
    logPrefix,
    messages,
    hashToken = defaultHashToken,
    now = () => new Date(),
  } = dependencies

  const {
    data: { user: nativeUser },
  } = await supabase.auth.getUser()

  if (nativeUser?.id) {
    logger.debug(`${logPrefix}: Sesion validada via Supabase Auth`, {
      userId: nativeUser.id,
    })
    return authSuccess(nativeUser.id)
  }

  const accessToken = cookieStore.get('access_token')?.value
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (accessToken && refreshToken) {
    logger.debug(`${logPrefix}: Usando sistema de refresh tokens`)

    const tokenHash = await hashToken(refreshToken)
    const { data: token, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('id, user_id, expires_at')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .gt('expires_at', now().toISOString())
      .single()

    if (!tokenError && token) {
      logger.debug(`${logPrefix}: Sesión validada via refresh token`, {
        userId: token.user_id,
      })
      return authSuccess(token.user_id)
    }
  }

  const sessionCookie = cookieStore.get('aprende-y-aplica-session')

  if (!sessionCookie) {
    logger.warn(`${logPrefix}: route accessed without any session`)
    return authFailure(401, messages.missingSession)
  }

  const { data: session, error: sessionError } = await supabase
    .from('user_session')
    .select('user_id, expires_at, revoked')
    .eq('jwt_id', sessionCookie.value)
    .single()

  if (sessionError || !session) {
    logger.warn(`${logPrefix}: invalid session token`, {
      error: sessionError?.message,
    })
    return authFailure(401, messages.invalidSession)
  }

  if (session.revoked) {
    logger.warn(`${logPrefix}: attempted access with revoked session`, {
      userId: session.user_id,
    })
    return authFailure(401, messages.revokedSession)
  }

  if (now() > new Date(session.expires_at)) {
    logger.warn(`${logPrefix}: attempted access with expired session`, {
      userId: session.user_id,
      expiresAt: session.expires_at,
    })
    return authFailure(401, messages.expiredSession)
  }

  return authSuccess(session.user_id)
}
