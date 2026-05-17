import { findLeastRecentlyUsedKey } from './memory-cache.eviction'
import { createCacheStats, estimateCacheEntrySize, updateHitRate } from './memory-cache.stats'
import type { CacheEntry, CacheStats } from './memory-cache.types'

export class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>()
  private stats: CacheStats
  private readonly maxSizeBytes: number
  private readonly defaultTTL: number
  private currentSizeBytes = 0

  constructor(maxSizeMB = 10, defaultTTL = 5 * 60 * 1000) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024
    this.defaultTTL = defaultTTL
    this.stats = createCacheStats(this.maxSizeBytes)
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.trackMiss()
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > this.defaultTTL) {
      this.delete(key)
      this.trackMiss()
      return null
    }

    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++
    updateHitRate(this.stats)
    return entry.value
  }

  set(key: string, value: T, customTTL?: number): boolean {
    void customTTL
    const size = estimateCacheEntrySize(value)

    if (size > this.maxSizeBytes * 0.5) {
      return false
    }

    if (this.cache.has(key)) {
      this.delete(key)
    }

    while (this.currentSizeBytes + size > this.maxSizeBytes && this.cache.size) {
      this.evictLRU()
    }

    const now = Date.now()
    this.cache.set(key, {
      value,
      timestamp: now,
      size,
      accessCount: 0,
      lastAccessed: now,
    })

    this.currentSizeBytes += size
    this.syncSizeStats()
    return true
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.currentSizeBytes -= entry.size
    this.syncSizeStats()
    return true
  }

  clear(): void {
    this.cache.clear()
    this.currentSizeBytes = 0
    this.syncSizeStats()
  }

  getStats(): CacheStats {
    return { ...this.stats, currentSize: this.currentSizeBytes, entryCount: this.cache.size }
  }

  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  private evictLRU(): void {
    const oldestKey = findLeastRecentlyUsedKey(this.cache)
    if (!oldestKey) return

    this.delete(oldestKey)
    this.stats.evictions++
  }

  private trackMiss(): void {
    this.stats.misses++
    updateHitRate(this.stats)
  }

  private syncSizeStats(): void {
    this.stats.entryCount = this.cache.size
    this.stats.currentSize = this.currentSizeBytes
  }
}
