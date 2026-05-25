import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { handleAuthenticatedAuthRouteRedirect } from './src/proxy/authenticated-auth-redirect'
import { handleOrganizationAuthRedirect } from './src/proxy/organization-auth-redirect'
import { createProxyObservabilityContext, finalizeProxyResponse } from './src/proxy/observability'
import { validateLegacyAdminRoute, validateLegacyInstructorRoute } from './src/proxy/legacy-role-guards'
import { validateLegacySessionAndQuestionnaire } from './src/proxy/legacy-session-validation'
import { proxyLogger as logger } from './src/proxy/logger'
import { addProxyRateLimitHeaders, applyProxyRateLimits } from './src/proxy/rate-limits'
import { getRouteState } from './src/proxy/routes'
import { getProxySessionCookies } from './src/proxy/session-cookies'
import { validateProtectedRouteAccess } from './src/proxy/protected-route-access'
import { validateApiRouteAccess } from './src/proxy/api-route-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const observability = createProxyObservabilityContext(request)
  const complete = (nextResponse: NextResponse) => finalizeProxyResponse(nextResponse, observability)
  logger.log('???? Middleware ejecut??ndose para:', pathname)

  const rateLimitResponse = await applyProxyRateLimits(request)
  if (rateLimitResponse) return complete(rateLimitResponse)

  const organizationAuthRedirect = await handleOrganizationAuthRedirect(request, logger)
  if (organizationAuthRedirect) return complete(organizationAuthRedirect)

  let response = await updateSession(request)
  const apiRouteAuthResponse = await validateApiRouteAccess(request, logger)
  if (apiRouteAuthResponse) return complete(apiRouteAuthResponse)

  const route = getRouteState(pathname)
  const cookies = getProxySessionCookies(request)

  const protectedRouteResponse = await validateProtectedRouteAccess(request, route, cookies, logger)
  if (protectedRouteResponse) return complete(protectedRouteResponse)

  const authRouteRedirect = await handleAuthenticatedAuthRouteRedirect(request, cookies, logger)
  if (authRouteRedirect) return complete(authRouteRedirect)

  if (route.isExemptRoute) {
    logger.log('??? Ruta exenta, continuando...')
    return complete(NextResponse.next())
  }

  if (!route.isProtectedRoute) {
    logger.log('??? Ruta no protegida, continuando...')
    return complete(NextResponse.next())
  }

  logger.log('???? Ruta protegida detectada:', pathname)
  const legacySessionResult = await validateLegacySessionAndQuestionnaire(request, response, logger)
  response = legacySessionResult.response
  if (legacySessionResult.shouldReturn) return complete(response)

  const adminRouteResponse = await validateLegacyAdminRoute(request, logger)
  if (adminRouteResponse) return complete(adminRouteResponse)

  const instructorRouteResponse = await validateLegacyInstructorRoute(request, logger)
  if (instructorRouteResponse) return complete(instructorRouteResponse)

  return complete(addProxyRateLimitHeaders(request, response, logger))
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
