import type { CacheStrategy } from './strategies'

export function withCache<T extends Response>(response: T, cacheHeaders: CacheStrategy): T {
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export function createCacheHeaders(cacheStrategy: CacheStrategy): Record<string, string> {
  return { ...cacheStrategy }
}
