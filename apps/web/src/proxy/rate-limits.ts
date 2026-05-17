import type { NextRequest, NextResponse } from 'next/server'
import { addRateLimitHeaders, applyRateLimit, checkRateLimit, RATE_LIMITS } from '../core/lib/rate-limit'
import type { ProxyLogger } from './logger'

export async function applyProxyRateLimits(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) return applyRateLimit(request, RATE_LIMITS.strict, 'auth')
  if (pathname.startsWith('/api/auth/reset-password') || pathname.startsWith('/api/auth/forgot-password')) return applyRateLimit(request, RATE_LIMITS.strict, 'password')
  if (request.method === 'POST' && (pathname.includes('/create') || pathname.startsWith('/api/admin/communities') || (pathname.startsWith('/api/courses') && pathname.includes('create')))) return applyRateLimit(request, RATE_LIMITS.create, 'create')
  if (pathname.startsWith('/api/upload') || pathname.includes('/upload')) return applyRateLimit(request, RATE_LIMITS.upload, 'upload')
  if (pathname.startsWith('/api/admin')) return applyRateLimit(request, RATE_LIMITS.admin, 'admin')
  if (!pathname.startsWith('/api/')) return null
  const rateLimitResult = checkRateLimit(request, RATE_LIMITS.api, 'api')
  if (!rateLimitResult.success && rateLimitResult.response) return rateLimitResult.response
  request.headers.set('X-Rate-Limit-Info', JSON.stringify({ limit: rateLimitResult.limit, remaining: rateLimitResult.remaining, reset: rateLimitResult.reset.toISOString() }))
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
