import type { RateLimitEntry } from './rate-limit.types'

export const rateLimitStore = new Map<string, RateLimitEntry>()

function cleanExpiredEntries(): void {
  const now = Date.now()
  const keysToDelete: string[] = []

  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach((key) => rateLimitStore.delete(key))
}

if (typeof window === 'undefined') {
  setInterval(cleanExpiredEntries, 5 * 60 * 1000)
}
