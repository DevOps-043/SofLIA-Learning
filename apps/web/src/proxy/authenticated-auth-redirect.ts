import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import { normalizeRole, redirectByNormalizedRole } from './role-redirect'
import { redirectBusinessRoleByActiveOrganization } from './business-organization-redirect'
import type { ProxyLogger } from './logger'
import type { ProxySessionCookies } from './session-cookies'

export async function handleAuthenticatedAuthRouteRedirect(request: NextRequest, cookies: ProxySessionCookies, logger: ProxyLogger) {
  if (!request.nextUrl.pathname.startsWith('/auth') || !cookies.hasSession) return null
  try {
    const supabase = createProxySupabaseClient(request)
    const userId = await getAuthenticatedUserId(request, supabase)
    if (!userId) {
      logger.log('?????? No se pudo obtener userId, redirigiendo a /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    const { data: userData } = await supabase.from('users').select('platform_role').eq('id', userId).single()
    const normalizedRole = normalizeRole(userData?.platform_role)
    logger.log('???? Usuario autenticado en ruta auth, redirigiendo seg??n platform_role:', normalizedRole)
    if (normalizedRole === 'business' || normalizedRole === 'business user') {
      return redirectBusinessRoleByActiveOrganization(request, supabase, userId, normalizedRole)
    }
    return redirectByNormalizedRole(request, normalizedRole)
  } catch (error) {
    logger.error('Error obteniendo rol del usuario en auth route:', error)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

async function getAuthenticatedUserId(request: NextRequest, supabase: ReturnType<typeof createProxySupabaseClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id) return user.id

  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  if (!sessionCookie?.value) return null
  const { data: sessionData } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).single()
  return sessionData?.user_id || null
}
