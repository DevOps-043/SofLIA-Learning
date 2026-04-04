type CacheEntry<T> = { value: T; expiresAt: number }

type TtlCacheStore = Map<string, CacheEntry<unknown>>

const globalCacheState = globalThis as typeof globalThis & {
  __ayap_ttl_cache__?: TtlCacheStore
}

const globalCache = globalCacheState.__ayap_ttl_cache__ || new Map<string, CacheEntry<unknown>>()
globalCacheState.__ayap_ttl_cache__ = globalCache

export function cacheGet<T>(key: string): T | undefined {
  const entry = globalCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key)
    return undefined
  }
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  globalCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

