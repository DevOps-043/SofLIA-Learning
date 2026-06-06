import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp, logSecurityEvent } from '../core/middleware/auth.logging'
import { resolveAuthenticatedUserId } from '../core/middleware/auth.session'
import { normalizeRole } from '../core/middleware/auth.roles'
import type { ValidRole } from '../core/middleware/auth.types'
import { createProxySupabaseClient } from './supabase'
import type { ProxyLogger } from './logger'

const ALL_AUTHENTICATED_ROLES: readonly ValidRole[] = [
  'Usuario',
  'Instructor',
  'Administrador',
  'Business',
  'Business User',
]

const ADMIN_ROLES: readonly ValidRole[] = ['Administrador']
const INSTRUCTOR_ROLES: readonly ValidRole[] = ['Instructor', 'Administrador']
const BUSINESS_ADMIN_ROLES: readonly ValidRole[] = ['Business', 'Administrador']
const BUSINESS_USER_ROLES: readonly ValidRole[] = [
  'Business User',
  'Business',
  'Administrador',
]

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const PUBLIC_EXACT_PATHS = new Set([
  '/api/_agent-trap',
  '/api/categories',
  '/api/csp-report',
  '/api/docs',
  '/api/geo/world',
  '/api/health',
  '/api/landing/contact',
  '/api/observability/health',
  '/api/releases',
  '/api/security/agent-handshake',
  '/api/security/automation-signal',
  '/api/security/csp-report',
  '/api/security/verify-human',
  '/api/study-planner/calendar/callback',
  '/api/youtube/video-info',
])

const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/api/certificates/verify/',
  '/api/invite/',
  '/api/test-translation/',
]

const AUTHENTICATED_PREFIXES = [
  '/api/account-settings',
  '/api/certificates',
  '/api/favorites',
  '/api/lesson-tracking',
  '/api/lia',
  '/api/my-courses',
  '/api/notifications',
  '/api/profile',
  '/api/study-planner',
  '/api/study-planner-chat',
  '/api/tours',
  '/api/upload',
  '/api/users',
  '/api/video-tracking',
]

const AUTHENTICATED_MUTATION_PREFIXES = [
  '/api/communities',
  '/api/courses',
  '/api/news',
  '/api/questionnaire',
  '/api/reels',
  '/api/reportes',
  '/api/statistics',
]

const AUTHENTICATED_EXACT_PATHS = new Set([
  '/api/ai-intent',
  '/api/organizations/create',
  '/api/organizations/join-request',
  '/api/organizations/my-status',
  '/api/performance/metrics',
  '/api/test-lia-db',
  '/api/tts',
])

const ROLE_PROTECTED_EXACT_PATHS = new Map<string, {
  description: string
  roles: readonly ValidRole[]
}>([
  [
    '/api/test-admin',
    {
      description: 'admin diagnostic API',
      roles: ADMIN_ROLES,
    },
  ],
])

const PUBLIC_GET_PATTERNS = [
  /^\/api\/communities(?:\/[^/]+)?$/,
  /^\/api\/courses(?:\/[^/]+)?$/,
  /^\/api\/courses\/[^/]+\/(?:full|intro-videos|modules|skills|learn-data|check-purchase)$/,
  /^\/api\/news(?:\/[^/]+)?$/,
  /^\/api\/news\/stats$/,
  /^\/api\/reels(?:\/(?:featured|[^/]+))?$/,
  /^\/api\/skills$/,
  /^\/api\/workshops\/[^/]+\/metadata$/,
]

export type ApiRouteAuthRequirement =
  | {
      kind: 'public'
      reason: string
    }
  | {
      kind: 'internal'
      reason: string
    }
  | {
      kind: 'authenticated'
      description: string
      roles: readonly ValidRole[]
      organizationSlug?: string
      organizationMode?: 'business-admin' | 'business-user'
    }

export function getApiRouteAuthRequirement(
  pathname: string,
  method = 'GET',
): ApiRouteAuthRequirement {
  const normalizedPath = normalizePathname(pathname)
  const normalizedMethod = method.toUpperCase()

  if (!normalizedPath.startsWith('/api')) {
    return { kind: 'public', reason: 'non-api route' }
  }

  if (normalizedMethod === 'OPTIONS') {
    return { kind: 'public', reason: 'cors preflight' }
  }

  if (
    normalizedPath.startsWith('/api/internal/jobs/') ||
    normalizedPath.startsWith('/api/cron/')
  ) {
    return { kind: 'internal', reason: 'internal job secret validates route' }
  }

  const orgScopedRoute = parseOrgScopedApiRoute(normalizedPath)
  if (orgScopedRoute?.section === 'business') {
    return {
      kind: 'authenticated',
      description: 'organization business API',
      roles: BUSINESS_ADMIN_ROLES,
      organizationSlug: orgScopedRoute.organizationSlug,
      organizationMode: 'business-admin',
    }
  }

  if (orgScopedRoute?.section === 'business-user') {
    return {
      kind: 'authenticated',
      description: 'organization business-user API',
      roles: BUSINESS_USER_ROLES,
      organizationSlug: orgScopedRoute.organizationSlug,
      organizationMode: 'business-user',
    }
  }

  if (isPublicApiRoute(normalizedPath, normalizedMethod)) {
    return { kind: 'public', reason: 'documented public API' }
  }

  const exactRoleRequirement = ROLE_PROTECTED_EXACT_PATHS.get(normalizedPath)
  if (exactRoleRequirement) {
    return {
      kind: 'authenticated',
      description: exactRoleRequirement.description,
      roles: exactRoleRequirement.roles,
    }
  }

  if (matchesSegment(normalizedPath, '/api/admin')) {
    return {
      kind: 'authenticated',
      description: 'admin API',
      roles: ADMIN_ROLES,
    }
  }

  if (matchesSegment(normalizedPath, '/api/instructor')) {
    return {
      kind: 'authenticated',
      description: 'instructor API',
      roles: INSTRUCTOR_ROLES,
    }
  }

  if (matchesSegment(normalizedPath, '/api/business')) {
    return {
      kind: 'authenticated',
      description: 'business API',
      roles: BUSINESS_ADMIN_ROLES,
    }
  }

  if (matchesSegment(normalizedPath, '/api/business-user')) {
    return {
      kind: 'authenticated',
      description: 'business-user API',
      roles: BUSINESS_USER_ROLES,
    }
  }

  if (
    AUTHENTICATED_EXACT_PATHS.has(normalizedPath) ||
    AUTHENTICATED_PREFIXES.some((prefix) => matchesSegment(normalizedPath, prefix))
  ) {
    return {
      kind: 'authenticated',
      description: 'authenticated API',
      roles: ALL_AUTHENTICATED_ROLES,
    }
  }

  if (
    MUTATING_METHODS.has(normalizedMethod) &&
    AUTHENTICATED_MUTATION_PREFIXES.some((prefix) => matchesSegment(normalizedPath, prefix))
  ) {
    return {
      kind: 'authenticated',
      description: 'authenticated mutation API',
      roles: ALL_AUTHENTICATED_ROLES,
    }
  }

  return { kind: 'public', reason: 'public read/API route' }
}

export async function validateApiRouteAccess(
  request: NextRequest,
  logger: ProxyLogger,
): Promise<NextResponse | null> {
  const requirement = getApiRouteAuthRequirement(
    request.nextUrl.pathname,
    request.method,
  )

  if (requirement.kind === 'public' || requirement.kind === 'internal') {
    return null
  }

  const pathname = request.nextUrl.pathname
  const clientIp = getClientIp(request)
  const supabase = createProxySupabaseClient(request)

  const resolvedUser = await resolveAuthenticatedUserId({
    request,
    supabase: supabase as Parameters<typeof resolveAuthenticatedUserId>[0]['supabase'],
    pathname,
    clientIp,
  })

  if (!resolvedUser.userId) {
    const authError = 'error' in resolvedUser ? resolvedUser.error : undefined
    logger.warn('API auth rejected unauthenticated request', {
      path: pathname,
      reason: authError ?? 'missing session',
    })
    if (!authError) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        path: pathname,
        ip: clientIp,
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      })
    }
    return createApiAuthFailureResponse(401, 'UNAUTHENTICATED', request)
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, cargo_rol, email')
    .eq('id', resolvedUser.userId)
    .single()

  if (userError || !userData) {
    await logSecurityEvent('USER_NOT_FOUND', {
      userId: resolvedUser.userId,
      path: pathname,
      ip: clientIp,
    })
    return createApiAuthFailureResponse(403, 'PROFILE_NOT_FOUND')
  }

  const role = normalizeRole(userData.cargo_rol)
  if (!role || !requirement.roles.includes(role)) {
    await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
      userId: resolvedUser.userId,
      role: userData.cargo_rol ?? undefined,
      path: pathname,
      ip: clientIp,
    })
    return createApiAuthFailureResponse(403, 'FORBIDDEN')
  }

  if (requirement.organizationSlug) {
    const hasAccess = await hasOrganizationAccess({
      organizationMode: requirement.organizationMode,
      organizationSlug: requirement.organizationSlug,
      role,
      supabase,
      userId: resolvedUser.userId,
    })

    if (!hasAccess) {
      await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: resolvedUser.userId,
        role,
        path: pathname,
        ip: clientIp,
      })
      return createApiAuthFailureResponse(403, 'FORBIDDEN')
    }
  }

  logger.log('API auth validation passed', {
    path: pathname,
    role,
    description: requirement.description,
  })

  return null
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isPublicApiRoute(pathname: string, method: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true

  return method === 'GET' && PUBLIC_GET_PATTERNS.some((pattern) => pattern.test(pathname))
}

function matchesSegment(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`)
}

function parseOrgScopedApiRoute(pathname: string):
  | {
      organizationSlug: string
      section: 'business' | 'business-user'
    }
  | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'api' || !segments[1]) return null
  if (segments[2] !== 'business' && segments[2] !== 'business-user') return null

  return {
    organizationSlug: decodeURIComponent(segments[1]),
    section: segments[2],
  }
}

function createApiAuthFailureResponse(status: 401 | 403, error: string, request?: NextRequest) {
  const response = NextResponse.json({ error }, { status })

  if (status === 401) {
    response.cookies.delete('aprende-y-aplica-session')
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    request?.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))
      .forEach((cookie) => response.cookies.delete(cookie.name))
  }

  return response
}

async function hasOrganizationAccess(params: {
  organizationMode?: 'business-admin' | 'business-user'
  organizationSlug: string
  role: ValidRole
  supabase: ReturnType<typeof createProxySupabaseClient>
  userId: string
}) {
  if (params.role === 'Administrador') return true

  const { data: membership } = await params.supabase
    .from('organization_users')
    .select(`
      role,
      organizations!inner (
        slug,
        is_active
      )
    `)
    .eq('user_id', params.userId)
    .eq('status', 'active')
    .eq('organizations.slug', params.organizationSlug)
    .eq('organizations.is_active', true)
    .maybeSingle()

  if (!membership) return false
  if (params.organizationMode === 'business-admin') {
    return membership.role === 'owner' || membership.role === 'admin'
  }

  return true
}
