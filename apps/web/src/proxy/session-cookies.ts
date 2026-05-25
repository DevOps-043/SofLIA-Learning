import type { NextRequest } from 'next/server'

export function getProxySessionCookies(request: NextRequest) {
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  const accessTokenCookie = request.cookies.get('access_token')
  const refreshTokenCookie = request.cookies.get('refresh_token')
  const supabaseAuthCookies = request.cookies
    .getAll()
    .filter((cookie) => isSupabaseAuthTokenCookie(cookie.name))
  const hasSupabaseAuthSession = supabaseAuthCookies.length > 0

  return {
    accessTokenCookie,
    hasAccessToken: Boolean(accessTokenCookie?.value),
    hasLegacySession: Boolean(sessionCookie?.value),
    hasRefreshToken: Boolean(refreshTokenCookie?.value),
    hasSession:
      Boolean(sessionCookie?.value) ||
      Boolean(accessTokenCookie?.value) ||
      hasSupabaseAuthSession,
    hasSupabaseAuthSession,
    refreshTokenCookie,
    sessionCookie,
    supabaseAuthCookies,
  }
}

export type ProxySessionCookies = ReturnType<typeof getProxySessionCookies>

function isSupabaseAuthTokenCookie(name: string) {
  return name.startsWith('sb-') && name.includes('-auth-token')
}
