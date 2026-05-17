import type { CacheStats } from './memory-cache.types'

export function createCacheStats(maxSize: number): CacheStats {
  return {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    maxSize,
    entryCount: 0,
    hitRate: '0.00%',
  }
}

export function estimateCacheEntrySize(value: unknown): number {
  return JSON.stringify(value).length * 2
}

export function updateHitRate(stats: CacheStats): void {
  const total = stats.hits + stats.misses
  stats.hitRate =
    total > 0 ? `${((stats.hits / total) * 100).toFixed(2)}%` : '0.00%'
}
