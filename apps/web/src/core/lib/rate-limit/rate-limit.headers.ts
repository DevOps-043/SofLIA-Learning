import type { NextResponse } from 'next/server'

export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: Date,
  retryAfterSeconds: number,
) {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toISOString(),
    'Retry-After': retryAfterSeconds.toString(),
  }
}

export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: Date,
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toISOString())
  return response
}
