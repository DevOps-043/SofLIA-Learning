import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { handleAuthenticatedAuthRouteRedirect } from './src/proxy/authenticated-auth-redirect'
import { handleOrganizationAuthRedirect } from './src/proxy/organization-auth-redirect'
import { validateLegacyAdminRoute, validateLegacyInstructorRoute } from './src/proxy/legacy-role-guards'
import { validateLegacySessionAndQuestionnaire } from './src/proxy/legacy-session-validation'
import { proxyLogger as logger } from './src/proxy/logger'
import { addProxyRateLimitHeaders, applyProxyRateLimits } from './src/proxy/rate-limits'
import { getRouteState } from './src/proxy/routes'
import { getProxySessionCookies } from './src/proxy/session-cookies'
import { validateProtectedRouteAccess } from './src/proxy/protected-route-access'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  logger.log('???? Middleware ejecut??ndose para:', pathname)

  const rateLimitResponse = await applyProxyRateLimits(request)
  if (rateLimitResponse) return rateLimitResponse

  const organizationAuthRedirect = await handleOrganizationAuthRedirect(request, logger)
  if (organizationAuthRedirect) return organizationAuthRedirect

  let response = await updateSession(request)
  const route = getRouteState(pathname)
  const cookies = getProxySessionCookies(request)

  const protectedRouteResponse = await validateProtectedRouteAccess(request, route, cookies, logger)
  if (protectedRouteResponse) return protectedRouteResponse

  const authRouteRedirect = await handleAuthenticatedAuthRouteRedirect(request, cookies, logger)
  if (authRouteRedirect) return authRouteRedirect

  if (route.isExemptRoute) {
    logger.log('??? Ruta exenta, continuando...')
    return NextResponse.next()
  }

  if (!route.isProtectedRoute) {
    logger.log('??? Ruta no protegida, continuando...')
    return NextResponse.next()
  }

  logger.log('???? Ruta protegida detectada:', pathname)
  const legacySessionResult = await validateLegacySessionAndQuestionnaire(request, response, logger)
  response = legacySessionResult.response
  if (legacySessionResult.shouldReturn) return response

  const adminRouteResponse = await validateLegacyAdminRoute(request, logger)
  if (adminRouteResponse) return adminRouteResponse

  const instructorRouteResponse = await validateLegacyInstructorRoute(request, logger)
  if (instructorRouteResponse) return instructorRouteResponse

  return addProxyRateLimitHeaders(request, response, logger)
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
