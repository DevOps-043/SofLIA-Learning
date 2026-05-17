import type { NextRequest } from 'next/server'

export function getProxySessionCookies(request: NextRequest) {
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  const accessTokenCookie = request.cookies.get('access_token')
  const refreshTokenCookie = request.cookies.get('refresh_token')
  return {
    accessTokenCookie,
    hasAccessToken: Boolean(accessTokenCookie?.value),
    hasLegacySession: Boolean(sessionCookie?.value),
    hasRefreshToken: Boolean(refreshTokenCookie?.value),
    hasSession: Boolean(sessionCookie?.value) || Boolean(accessTokenCookie?.value),
    refreshTokenCookie,
    sessionCookie,
  }
}

export type ProxySessionCookies = ReturnType<typeof getProxySessionCookies>
