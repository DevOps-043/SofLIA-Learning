import type { RequestRecord } from './rate-limit.types';
import { RateLimitTier } from './rate-limit.types';

const rateLimitCache = new Map<string, RequestRecord>();

export function getRateLimitKey(
  identifier: string,
  tier: RateLimitTier
): string {
  return `ratelimit:${tier}:${identifier}`;
}

export function getRateLimitRecord(key: string): RequestRecord | undefined {
  return rateLimitCache.get(key);
}

export function setRateLimitRecord(key: string, record: RequestRecord): void {
  rateLimitCache.set(key, record);
}

export function resetRateLimit(identifier: string, tier: RateLimitTier): void {
  rateLimitCache.delete(getRateLimitKey(identifier, tier));
}

export function blockIdentifier(
  identifier: string,
  tier: RateLimitTier,
  durationMs: number = 24 * 60 * 60 * 1000
): void {
  const now = Date.now();
  rateLimitCache.set(getRateLimitKey(identifier, tier), {
    count: 999999,
    resetTime: now + durationMs,
    blockedUntil: now + durationMs,
  });
}

export function getRateLimitStats() {
  let blockedCount = 0;
  const now = Date.now();

  rateLimitCache.forEach((record) => {
    if (record.blockedUntil && record.blockedUntil > now) {
      blockedCount++;
    }
  });

  return {
    size: rateLimitCache.size,
    blockedIdentifiers: blockedCount,
  };
}

export function clearRateLimitCache(): void {
  rateLimitCache.clear();
}

function cleanExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitCache.forEach((record, key) => {
    if (record.resetTime < now && (!record.blockedUntil || record.blockedUntil < now)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitCache.delete(key));
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredEntries, 5 * 60 * 1000);
}
