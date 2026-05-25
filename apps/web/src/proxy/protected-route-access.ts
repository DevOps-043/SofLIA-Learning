import { NextResponse, type NextRequest } from 'next/server'
import { RefreshTokenService } from '../lib/auth/refreshToken.service'
import { validateAdminAccess, validateBusinessAccess, validateInstructorAccess, validateUserAccess } from '../core/middleware/auth.middleware'
import type { ProxyLogger } from './logger'
import type { ProxyRouteState } from './routes'
import type { ProxySessionCookies } from './session-cookies'

export async function validateProtectedRouteAccess(request: NextRequest, route: ProxyRouteState, cookies: ProxySessionCookies, logger: ProxyLogger) {
  if (!route.isProtectedRoute) return null
  if (!cookies.hasSession && !cookies.hasRefreshToken) {
    logger.log('??? Redirigiendo a /auth - no hay sesi??n para ruta protegida')
    return NextResponse.redirect(new URL('/auth?error=session_required', request.url))
  }
  if (cookies.hasRefreshToken && !cookies.hasAccessToken) {
    const refreshFailure = await refreshAccessTokenOrRedirect(request, logger)
    if (refreshFailure) return refreshFailure
  }
  logger.log('???? Validando permisos de rol para:', request.nextUrl.pathname)
  const roleValidationResponse = await validateRouteRole(request, route, logger)
  if (roleValidationResponse) {
    logger.log('??? Acceso denegado por validaci??n de rol')
    return roleValidationResponse
  }
  logger.log('??? Validaci??n de rol exitosa')
  return null
}

async function refreshAccessTokenOrRedirect(request: NextRequest, logger: ProxyLogger) {
  logger.log('???? Intentando refrescar access token expirado')
  try {
    await RefreshTokenService.refreshSession()
    logger.log('??? Access token refrescado exitosamente')
    return null
  } catch (error) {
    logger.error('??? Error refrescando token:', error)
    const redirectResponse = NextResponse.redirect(new URL('/auth?error=session_expired', request.url))
    redirectResponse.cookies.delete('access_token')
    redirectResponse.cookies.delete('refresh_token')
    redirectResponse.cookies.delete('aprende-y-aplica-session')
    return redirectResponse
  }
}

async function validateRouteRole(request: NextRequest, route: ProxyRouteState, logger: ProxyLogger) {
  if (route.isAdminRoute) { logger.log('???? Validando acceso de Administrador'); return validateAdminAccess(request) }
  if (route.isInstructorRoute) { logger.log('???? Validando acceso de Instructor'); return validateInstructorAccess(request) }
  if (route.isBusinessRoute) { logger.log('???? Validando acceso de Business'); return validateBusinessAccess(request) }
  if (route.isUserRoute) { logger.log('???? Validando acceso de Usuario'); return validateUserAccess(request) }
  return null
}
