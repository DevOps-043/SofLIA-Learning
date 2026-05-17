import {
  SECURE_COOKIE_OPTIONS,
  getCustomCookieOptions,
} from '@/lib/auth/cookie-config'
import { RefreshTokenService } from '@/lib/auth/refreshToken.service'
import { cookies, headers } from 'next/headers'

import { SessionService } from '../../services/session.service'
import { getUnknownErrorMessage, getUnknownErrorStack } from './errors'
import { notifyLoginSuccess } from './login-notifications'

export async function createLoginSessions(input: {
  rememberMe: boolean
  userId: string
}) {
  try {
    const cookieStore = await cookies()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'unknown'
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'

    const mockRequest = buildSessionRequest(ip, userAgent)
    const [sessionInfo, legacySession] = await Promise.all([
      RefreshTokenService.createSession(input.userId, input.rememberMe, mockRequest),
      SessionService.createLegacySession(input.userId, input.rememberMe),
    ])

    cookieStore.set('access_token', sessionInfo.accessToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.accessExpiresAt,
    })

    cookieStore.set('refresh_token', sessionInfo.refreshToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: sessionInfo.refreshExpiresAt,
    })

    const maxAge = input.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60
    cookieStore.set('aprende-y-aplica-session', legacySession.sessionToken, {
      ...getCustomCookieOptions(maxAge),
      expires: legacySession.expiresAt,
    })

    await notifyLoginSuccess({
      ip,
      rememberMe: input.rememberMe,
      userAgent,
      userId: input.userId,
    })

    return null
  } catch (sessionError) {
    console.error('[loginAction] Error critico creando sesion:', {
      error: sessionError,
      message: getUnknownErrorMessage(sessionError, 'Error desconocido'),
      stack: getUnknownErrorStack(sessionError),
    })
    return { error: 'Error al crear la sesion. Por favor, intenta nuevamente.' }
  }
}

function buildSessionRequest(ip: string, userAgent: string): Request {
  const requestHeaders = new Headers()
  requestHeaders.set('user-agent', userAgent)
  requestHeaders.set('x-real-ip', ip)

  return new Request('http://localhost', {
    headers: requestHeaders,
  })
}
