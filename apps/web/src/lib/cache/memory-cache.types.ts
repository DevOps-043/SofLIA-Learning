export interface CacheEntry<T> {
  value: T
  timestamp: number
  size: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  currentSize: number
  maxSize: number
  entryCount: number
  hitRate: string
}
