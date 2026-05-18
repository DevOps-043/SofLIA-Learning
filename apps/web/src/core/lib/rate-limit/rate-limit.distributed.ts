import { NextRequest, NextResponse } from 'next/server'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
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

export async function checkDistributedRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix = 'general',
): Promise<RateLimitResult> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return checkRateLimit(request, config, prefix)
  }

  try {
    return await checkRedisRateLimit(request, config, prefix)
  } catch {
    return checkRateLimit(request, config, prefix)
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
  const remaining = Math.max(0, effectiveLimit - count)
  const retryAfter = Math.max(1, Math.ceil((reset.getTime() - now) / 1000))
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
