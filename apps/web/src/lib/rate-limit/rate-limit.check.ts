import {
  getRateLimitKey,
  getRateLimitRecord,
  setRateLimitRecord,
} from './rate-limit.cache';
import { RATE_LIMIT_CONFIG } from './rate-limit.config';
import { RateLimitTier, type RateLimitResult } from './rate-limit.types';

export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): RateLimitResult {
  const config = RATE_LIMIT_CONFIG[tier];
  const key = getRateLimitKey(identifier, tier);
  const now = Date.now();
  let record = getRateLimitRecord(key);

  if (record?.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
      blockedUntil: record.blockedUntil,
    };
  }

  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + config.windowMs };
    setRateLimitRecord(key, record);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  if (record.count > config.maxRequests) {
    record.blockedUntil = now + config.blockDurationMs;
    setRateLimitRecord(key, record);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
      blockedUntil: record.blockedUntil,
    };
  }

  setRateLimitRecord(key, record);
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}
