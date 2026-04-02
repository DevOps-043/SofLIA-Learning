import { NextRequest, NextResponse } from 'next/server'
import {
  addRateLimitHeaders,
  checkRateLimit,
  type RateLimitConfig,
} from '@/core/lib/rate-limit'

export const AI_CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  message:
    'Demasiadas solicitudes al chatbot. Por favor, espera un momento.',
}

export const STUDY_PLANNER_CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000,
  message:
    'Demasiadas solicitudes al planificador. Por favor, espera un momento.',
}

export interface RateLimitSuccessResult {
  success: true
  limit: number
  remaining: number
  reset: Date
}

export interface RateLimitFailureResult {
  success: false
  response: NextResponse
}

export type RouteRateLimitResult =
  | RateLimitSuccessResult
  | RateLimitFailureResult

export function applyRouteRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string,
): RouteRateLimitResult {
  const result = checkRateLimit(request, config, prefix)

  if (!result.success || !result.response) {
    return result.success
      ? {
          success: true,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        }
      : {
          success: false,
          response:
            result.response ??
            NextResponse.json(
              { success: false, error: config.message ?? 'Too many requests' },
              { status: 429 },
            ),
        }
  }

  return {
    success: false,
    response: result.response,
  }
}

export function withRouteRateLimitHeaders(
  response: NextResponse,
  rateLimit: RateLimitSuccessResult,
) {
  return addRateLimitHeaders(
    response,
    rateLimit.limit,
    rateLimit.remaining,
    rateLimit.reset,
  )
}
