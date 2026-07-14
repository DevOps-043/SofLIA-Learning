import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import { normalizeRole } from './role-redirect'
import type { ProxyLogger } from './logger'

export async function validateLegacyAdminRoute(request: NextRequest, logger: ProxyLogger) {
  if (!request.nextUrl.pathname.startsWith('/admin')) return null
  logger.log('???? Verificando acceso de administrador...')
  try {
    const userRole = await getLegacySessionUserRole(request)
    if (userRole !== 'administrador') {
      logger.log('??? No es administrador, redirigiendo a /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    logger.log('??? Acceso de administrador autorizado')
    return null
  } catch (error) {
    logger.error('??? Error checking admin role:', error)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export async function validateLegacyInstructorRoute(request: NextRequest, logger: ProxyLogger) {
  if (!request.nextUrl.pathname.startsWith('/instructor')) return null
  try {
    const userRole = await getLegacySessionUserRole(request)
    if (userRole !== 'instructor' && userRole !== 'administrador') return NextResponse.redirect(new URL('/dashboard', request.url))
    return null
  } catch (error) {
    logger.error('Error checking instructor role:', error)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

async function getLegacySessionUserRole(request: NextRequest) {
  const supabase = createProxySupabaseClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: userData } = await supabase.from('users').select('platform_role').eq('id', user.id).single()
    return normalizeRole(userData?.platform_role)
  }

  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  if (!sessionCookie?.value) return null
  const { data: sessionData } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).single()
  if (!sessionData) return null
  const { data: userData } = await supabase.from('users').select('platform_role').eq('id', sessionData.user_id).single()
  return normalizeRole(userData?.platform_role)
}
