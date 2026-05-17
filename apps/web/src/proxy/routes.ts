import { ROLE_ROUTES } from '../core/middleware/auth.middleware'

const exemptRoutes = ['/auth', '/api', '/statistics', '/welcome', '/questionnaire', '/_next', '/favicon.ico']
const authRoutes = ['/auth']

export function getRouteState(pathname: string) {
  const isAdminRoute = ROLE_ROUTES.admin.some((route) => pathname.startsWith(route))
  const isInstructorRoute = ROLE_ROUTES.instructor.some((route) => pathname.startsWith(route))
  const isUserRoute = ROLE_ROUTES.user.some((route) => pathname.startsWith(route))
  const isBusinessRoute = ROLE_ROUTES.business.some((route) => pathname.startsWith(route))
  const isProtectedRoute = isAdminRoute || isInstructorRoute || isUserRoute || isBusinessRoute
  return {
    isAdminRoute,
    isAuthRoute: authRoutes.some((route) => pathname.startsWith(route)),
    isBusinessRoute,
    isExemptRoute: exemptRoutes.some((route) => pathname.startsWith(route)),
    isInstructorRoute,
    isProtectedRoute,
    isUserRoute,
  }
}

export type ProxyRouteState = ReturnType<typeof getRouteState>
