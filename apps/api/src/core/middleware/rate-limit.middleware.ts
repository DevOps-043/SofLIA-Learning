import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

import { config } from '@/config/env'

interface RateLimiterOptions {
  max?: number
  windowMs?: number
}

function resolveRequestKey(req: Request) {
  if (req.user?.id) {
    return `user:${req.user.id}`
  }

  const forwardedFor = req.headers['x-forwarded-for']
  const ipFromHeader =
    typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : undefined

  return ipFromHeader || req.ip || 'anonymous'
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? config.RATE_LIMIT_WINDOW_MS,
    max: options.max ?? config.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveRequestKey,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Demasiadas peticiones, intenta de nuevo mas tarde',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      })
    },
  })
}

export const apiRateLimiter = createRateLimiter()
