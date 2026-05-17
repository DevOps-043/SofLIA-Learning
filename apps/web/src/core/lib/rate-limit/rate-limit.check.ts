import { NextRequest, NextResponse } from 'next/server'
import { createRateLimitHeaders } from './rate-limit.headers'
import { getIdentifier } from './rate-limit.identifier'
import { rateLimitStore } from './rate-limit.store'
import type { RateLimitConfig, RateLimitResult } from './rate-limit.types'

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix = 'general',
): RateLimitResult {
  const identifier = getIdentifier(request, prefix)
  const now = Date.now()
  let entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs, requests: [] }
    rateLimitStore.set(identifier, entry)
  }

  const windowStart = now - config.windowMs
  entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart)
  entry.requests.push(now)
  entry.count = entry.requests.length

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const reset = new Date(entry.resetTime)
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
  const headers = createRateLimitHeaders(
    config.maxRequests,
    remaining,
    reset,
    retryAfter,
  )

  if (entry.count > config.maxRequests) {
    const response = NextResponse.json(
      {
        success: false,
        error: config.message || 'Too many requests',
        retryAfter: reset.toISOString(),
        limit: config.maxRequests,
        remaining: 0,
      },
      { status: 429, headers },
    )

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      response,
    }
  }

  return { success: true, limit: config.maxRequests, remaining, reset }
}

export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix = 'general',
): Promise<NextResponse | null> {
  const result = checkRateLimit(request, config, prefix)
  return !result.success && result.response ? result.response : null
}
