import type { NextRequest } from 'next/server'
import { getIdentifier } from './rate-limit.identifier'
import { rateLimitStore } from './rate-limit.store'

export function getRateLimitStats(): {
  totalEntries: number
  entries: Array<{
    identifier: string
    count: number
    resetTime: string
  }>
} {
  const entries: Array<{
    identifier: string
    count: number
    resetTime: string
  }> = []

  rateLimitStore.forEach((entry, key) => {
    entries.push({
      identifier: key,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString(),
    })
  })

  return { totalEntries: rateLimitStore.size, entries }
}

export function clearRateLimit(
  request: NextRequest,
  prefix = 'general',
): void {
  rateLimitStore.delete(getIdentifier(request, prefix))
}

export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}
