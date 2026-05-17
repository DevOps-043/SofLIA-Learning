import { checkRateLimit } from './rate-limit.check';
import { RATE_LIMIT_CONFIG } from './rate-limit.config';
import { getClientIP } from './rate-limit.ip';
import { RateLimitTier } from './rate-limit.types';

export function rateLimitMiddleware(
  request: Request,
  tier: RateLimitTier,
  identifier?: string
): Response | null {
  const id = identifier || getClientIP(request);
  const result = checkRateLimit(id, tier);

  if (result.allowed) return null;

  const config = RATE_LIMIT_CONFIG[tier];
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: config.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter,
        resetTime: new Date(result.resetTime).toISOString(),
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
      },
    }
  );
}

export function getRateLimitHeaders(
  identifier: string,
  tier: RateLimitTier
): Record<string, string> {
  const result = checkRateLimit(identifier, tier);
  const config = RATE_LIMIT_CONFIG[tier];

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
  };
}
