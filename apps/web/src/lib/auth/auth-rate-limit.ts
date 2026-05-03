import {
  getClientIP,
  RateLimitTier,
  rateLimitMiddleware,
} from '@/lib/rate-limit/advanced-rate-limit'

export function applyAuthRateLimit(request: Request, userId?: string | null) {
  return rateLimitMiddleware(
    request,
    RateLimitTier.AUTH,
    userId ?? getClientIP(request)
  )
}

export function applyAuthReadRateLimit(request: Request, userId?: string | null) {
  return rateLimitMiddleware(
    request,
    RateLimitTier.API_READ,
    userId ?? getClientIP(request)
  )
}
