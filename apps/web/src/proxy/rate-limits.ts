import type { NextRequest, NextResponse } from 'next/server'
import { addRateLimitHeaders, checkDistributedRateLimit, RATE_LIMITS } from '../core/lib/rate-limit'
import type { RateLimitConfig } from '../core/lib/rate-limit'
import type { ProxyLogger } from './logger'

type RouteRateLimitPolicy = {
  config: RateLimitConfig
  prefix: string
}

const ONE_MINUTE_MS = 60 * 1000

const ROUTE_RATE_LIMITS = {
  auth: {
    maxRequests: 5,
    burst: 3,
    windowMs: ONE_MINUTE_MS,
    message: 'Demasiados intentos. Intenta nuevamente en un minuto.',
  },
  adminMutation: {
    maxRequests: 30,
    burst: 10,
    windowMs: ONE_MINUTE_MS,
    message: 'Limite de mutaciones administrativas alcanzado.',
  },
  cacheableRead: {
    maxRequests: 300,
    burst: 50,
    windowMs: ONE_MINUTE_MS,
    message: 'Demasiadas lecturas. Espera un momento.',
  },
  aiChat: {
    maxRequests: 20,
    burst: 5,
    windowMs: ONE_MINUTE_MS,
    message: 'Limite de solicitudes de IA alcanzado.',
  },
  upload: {
    maxRequests: 10,
    burst: 2,
    windowMs: ONE_MINUTE_MS,
    message: 'Limite de subidas alcanzado.',
  },
  bulkImport: {
    maxRequests: 2,
    burst: 1,
    windowMs: ONE_MINUTE_MS,
    message: 'Limite de importaciones masivas alcanzado.',
  },
  publicLanding: {
    maxRequests: 600,
    burst: 100,
    windowMs: ONE_MINUTE_MS,
    message: 'Demasiadas solicitudes publicas.',
  },
} as const satisfies Record<string, RateLimitConfig>

export async function applyProxyRateLimits(request: NextRequest) {
  const policy = resolveRouteRateLimitPolicy(request)
  if (!policy) return null

  const rateLimitResult = await checkDistributedRateLimit(request, policy.config, policy.prefix)
  if (!rateLimitResult.success && rateLimitResult.response) return rateLimitResult.response
  request.headers.set('X-Rate-Limit-Info', JSON.stringify({ limit: rateLimitResult.limit, remaining: rateLimitResult.remaining, reset: rateLimitResult.reset.toISOString() }))
  return null
}

export function resolveRouteRateLimitPolicy(request: NextRequest): RouteRateLimitPolicy | null {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()

  // Availability-sensitive, authenticated reads must not fail closed merely
  // because the distributed limiter is temporarily unavailable. They retain
  // the local limiter here (and /api/auth/me has an additional route limiter),
  // while login, token, MFA and password mutations remain fail-closed below.
  if (
    method === 'GET' &&
    (pathname === '/api/auth/me' ||
      pathname === '/api/auth/dashboard-destination')
  ) {
    return { config: ROUTE_RATE_LIMITS.cacheableRead, prefix: 'auth-read' }
  }

  // GET handlers below /api/lia only read configuration, conversation history
  // or capability metadata. They must retain local rate limiting when Redis is
  // unavailable; POST/DELETE and actual AI generation remain fail-closed.
  if (method === 'GET' && pathname.startsWith('/api/lia/')) {
    return { config: ROUTE_RATE_LIMITS.cacheableRead, prefix: 'lia-read' }
  }

  if (pathname.startsWith('/api/auth/reset-password') || pathname.startsWith('/api/auth/forgot-password')) {
    return { config: ROUTE_RATE_LIMITS.auth, prefix: 'password' }
  }

  if (pathname.startsWith('/api/auth')) {
    return { config: ROUTE_RATE_LIMITS.auth, prefix: 'auth' }
  }

  if (pathname.includes('/import')) {
    return { config: ROUTE_RATE_LIMITS.bulkImport, prefix: 'bulk-import' }
  }

  if (pathname.startsWith('/api/upload') || pathname.includes('/upload')) {
    return { config: ROUTE_RATE_LIMITS.upload, prefix: 'upload' }
  }

  if (pathname.startsWith('/api/ai-chat') || pathname.startsWith('/api/lia') || pathname.includes('/dashboard/chat')) {
    return { config: ROUTE_RATE_LIMITS.aiChat, prefix: 'ai-chat' }
  }

  if (pathname.startsWith('/api/admin') && method !== 'GET') {
    return { config: ROUTE_RATE_LIMITS.adminMutation, prefix: 'admin-mutation' }
  }

  if (method === 'GET' && (pathname === '/' || pathname.startsWith('/business') || pathname.startsWith('/downloads'))) {
    return { config: ROUTE_RATE_LIMITS.publicLanding, prefix: 'public-landing' }
  }

  if (method === 'GET' && pathname.startsWith('/api/')) {
    return { config: ROUTE_RATE_LIMITS.cacheableRead, prefix: 'api-read' }
  }

  if (pathname.startsWith('/api/')) {
    return { config: RATE_LIMITS.api, prefix: 'api' }
  }

  return null
}

export function addProxyRateLimitHeaders(request: NextRequest, response: NextResponse, logger: ProxyLogger) {
  const rateLimitInfo = request.headers.get('X-Rate-Limit-Info')
  if (!rateLimitInfo) return response
  try {
    const { limit, remaining, reset } = JSON.parse(rateLimitInfo)
    return addRateLimitHeaders(response, limit, remaining, new Date(reset))
  } catch (error) {
    logger.warn('Error agregando headers de rate limit:', error)
    return response
  }
}
