import type { CacheEntry } from './memory-cache.types'

export function findLeastRecentlyUsedKey<T>(
  cache: Map<string, CacheEntry<T>>,
): string | null {
  let oldestKey: string | null = null
  let oldestTime = Infinity

  for (const [key, entry] of cache.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed
      oldestKey = key
    }
  }

  return oldestKey
}
