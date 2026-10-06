import { NextRequest, NextResponse } from 'next/server'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/utils/logger'
import { createRateLimitHeaders } from './rate-limit.headers'
import { getIdentifier } from './rate-limit.identifier'
import { checkRateLimit } from './rate-limit.check'
import type { RateLimitConfig, RateLimitResult } from './rate-limit.types'

type RedisCommandValue = string | number

interface RedisRestResponse<T> {
  result?: T
  error?: string
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN
const KEY_PREFIX = 'soflia:rate-limit:v1'
const SECURITY_CRITICAL_PREFIXES = new Set([
  'ai-chat',
  'auth',
  'bulk-import',
  'password',
  'upload',
])

export async function checkDistributedRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix = 'general',
): Promise<RateLimitResult> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    if (process.env.NODE_ENV === 'production' && SECURITY_CRITICAL_PREFIXES.has(prefix)) {
      // No Redis installation is required when the server already has Supabase.
      // This is a shared, atomic counter, never a per-instance memory fallback.
      // A configured Redis outage still fails closed below: switching stores in
      // the middle of a window would give callers a second request budget.
      try {
        return await checkSupabaseRateLimit(request, config, prefix)
      } catch {
        logger.error('Distributed rate limiter unavailable', {
          prefix,
          reason: 'SUPABASE_RATE_LIMIT_UNAVAILABLE',
        })
        return createUnavailableRateLimitResult(config)
      }
    }
    return checkRateLimit(request, config, prefix)
  }

  try {
    return await checkRedisRateLimit(request, config, prefix)
  } catch {
    if (process.env.NODE_ENV === 'production' && SECURITY_CRITICAL_PREFIXES.has(prefix)) {
      logger.error('Distributed rate limiter unavailable', {
        prefix,
        reason: 'REDIS_REQUEST_FAILED',
      })
      return createUnavailableRateLimitResult(config)
    }
    return checkRateLimit(request, config, prefix)
  }
}

function createUnavailableRateLimitResult(config: RateLimitConfig): RateLimitResult {
  const reset = new Date(Date.now() + Math.min(config.windowMs, 60_000))
  return {
    success: false,
    limit: 0,
    remaining: 0,
    reset,
    response: NextResponse.json(
      { error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '60',
        },
      },
    ),
  }
}

async function checkRedisRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string,
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `${KEY_PREFIX}:${prefix}:${stableHash(getIdentifier(request, prefix))}`
  const effectiveLimit = config.maxRequests + (config.burst ?? 0)
  const count = await executeRedisCommand<number>(['INCR', key])

  if (count === 1) {
    await executeRedisCommand<number>(['PEXPIRE', key, config.windowMs])
  }

  const ttlMs = await executeRedisCommand<number>(['PTTL', key])
  const reset = new Date(now + (ttlMs > 0 ? ttlMs : config.windowMs))
  return createCountedRateLimitResult(count, reset, config)
}

async function checkSupabaseRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string,
): Promise<RateLimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !token) throw new Error('SUPABASE_RATE_LIMIT_CREDENTIALS_MISSING')

  const response = await fetchWithCircuitBreaker(
    'supabase-rate-limit',
    `${url.replace(/\/$/, '')}/rest/v1/rpc/check_distributed_rate_limit`,
    {
      method: 'POST',
      headers: {
        apikey: token,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: `${KEY_PREFIX}:${getIdentifier(request, prefix)}`,
        p_limit: config.maxRequests + (config.burst ?? 0),
        p_window_ms: config.windowMs,
      }),
      cache: 'no-store',
    },
    { timeoutMs: 2_000, maxRetries: 0, minimumRequestCount: 3, resetTimeoutMs: 30_000 },
  )
  if (!response.ok) throw new Error('SUPABASE_RATE_LIMIT_REQUEST_FAILED')

  const payload: unknown = await response.json()
  const row = Array.isArray(payload) && payload.length === 1 ? payload[0] : null
  if (!row || typeof row !== 'object' || !Number.isSafeInteger(row.request_count)
    || row.request_count < 1 || typeof row.reset_at !== 'string') {
    throw new Error('SUPABASE_RATE_LIMIT_INVALID_RESPONSE')
  }
  const reset = new Date(row.reset_at)
  if (!Number.isFinite(reset.getTime())) throw new Error('SUPABASE_RATE_LIMIT_INVALID_RESPONSE')
  return createCountedRateLimitResult(row.request_count, reset, config)
}

function createCountedRateLimitResult(
  count: number,
  reset: Date,
  config: RateLimitConfig,
): RateLimitResult {
  const effectiveLimit = config.maxRequests + (config.burst ?? 0)
  const remaining = Math.max(0, effectiveLimit - count)
  const retryAfter = Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))
  const headers = createRateLimitHeaders(effectiveLimit, remaining, reset, retryAfter)

  if (count > effectiveLimit) {
    const response = NextResponse.json(
      {
        success: false,
        error: config.message || 'Too many requests',
        retryAfter: reset.toISOString(),
        limit: effectiveLimit,
        remaining: 0,
      },
      { status: 429, headers },
    )

    return {
      success: false,
      limit: effectiveLimit,
      remaining: 0,
      reset,
      response,
    }
  }

  return { success: true, limit: effectiveLimit, remaining, reset }
}

async function executeRedisCommand<T>(command: readonly RedisCommandValue[]): Promise<T> {
  const response = await fetchWithCircuitBreaker(
    'redis-rate-limit',
    REDIS_URL!,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    },
    {
      timeoutMs: 2_000,
      errorThresholdPercentage: 50,
      resetTimeoutMs: 30_000,
      maxRetries: 0,
      minimumRequestCount: 3,
    },
  )

  if (!response.ok) {
    throw new Error(`Redis REST error ${response.status}`)
  }

  const payload = await response.json() as RedisRestResponse<T>
  if (payload.error) {
    throw new Error(payload.error)
  }

  return payload.result as T
}

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}
