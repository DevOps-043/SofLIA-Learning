import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(
    key: string,
    value: T,
    ttlSec: number,
    options?: { tags?: readonly string[] },
  ): Promise<void>
  del(key: string | readonly string[]): Promise<void>
  getStats(): CacheStats
  invalidateByTag(tag: string): Promise<void>
}

export interface CacheStats {
  deletes: number
  entries: number | null
  hitRate: number
  hits: number
  invalidations: number
  misses: number
  provider: 'memory' | 'upstash-redis'
  sets: number
}

type CacheRecord = {
  expiresAt: number
  tags: readonly string[]
  value: unknown
}

type RedisCommand = readonly (string | number)[]

type UpstashRestPayload = {
  error?: string
  result?: unknown
}

const REDIS_TAG_INDEX_TTL_SEC = 30 * 24 * 60 * 60

const globalCacheState = globalThis as typeof globalThis & {
  __soflia_cache_adapter__?: CacheAdapter
}

export const CACHE_KEY_PREFIX = 'soflia'

export function buildTenantCacheKey(params: {
  id?: string
  orgId: string
  resourceType: string
  scope?: string
}): string {
  return [
    CACHE_KEY_PREFIX,
    'tenant',
    params.orgId,
    'resource',
    params.resourceType,
    params.scope,
    params.id,
  ]
    .filter(Boolean)
    .join(':')
}

export function buildUserCacheKey(params: {
  resourceType: string
  userId: string
  variant?: string
}): string {
  return [
    CACHE_KEY_PREFIX,
    'user',
    params.userId,
    'resource',
    params.resourceType,
    params.variant,
  ]
    .filter(Boolean)
    .join(':')
}

export class MemoryCacheAdapter implements CacheAdapter {
  private readonly entries = new Map<string, CacheRecord>()
  private readonly tagIndex = new Map<string, Set<string>>()
  private stats = createEmptyCacheStats('memory')

  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key)
    if (!entry) {
      this.stats.misses += 1
      return null
    }

    if (Date.now() >= entry.expiresAt) {
      await this.del(key)
      this.stats.misses += 1
      return null
    }

    this.stats.hits += 1
    return entry.value as T
  }

  async set<T>(
    key: string,
    value: T,
    ttlSec: number,
    options?: { tags?: readonly string[] },
  ): Promise<void> {
    await this.del(key)

    const tags = options?.tags ?? []
    this.entries.set(key, {
      expiresAt: Date.now() + normalizeTtlSec(ttlSec) * 1000,
      tags,
      value,
    })

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag) ?? new Set<string>()
      keys.add(key)
      this.tagIndex.set(tag, keys)
    }

    this.stats.sets += 1
  }

  async del(key: string | readonly string[]): Promise<void> {
    const keys = typeof key === 'string' ? [key] : key
    let deleted = 0

    for (const cacheKey of keys) {
      const entry = this.entries.get(cacheKey)
      if (this.entries.delete(cacheKey)) {
        deleted += 1
      }

      for (const tag of entry?.tags ?? []) {
        const taggedKeys = this.tagIndex.get(tag)
        taggedKeys?.delete(cacheKey)
        if (taggedKeys?.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }

    this.stats.deletes += deleted
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      entries: this.entries.size,
      hitRate: calculateHitRate(this.stats.hits, this.stats.misses),
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = Array.from(this.tagIndex.get(tag) ?? [])
    await this.del(keys)
    this.tagIndex.delete(tag)
    this.stats.invalidations += 1
  }
}

export class UpstashRedisCacheAdapter implements CacheAdapter {
  private stats = createEmptyCacheStats('upstash-redis')

  constructor(
    private readonly restUrl: string,
    private readonly restToken: string,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const result = await this.command<string | null>(['GET', key])
    if (!result) {
      this.stats.misses += 1
      return null
    }
    this.stats.hits += 1
    return JSON.parse(result) as T
  }

  async set<T>(
    key: string,
    value: T,
    ttlSec: number,
    options?: { tags?: readonly string[] },
  ): Promise<void> {
    await this.command(['SET', key, JSON.stringify(value), 'EX', normalizeTtlSec(ttlSec)])
    this.stats.sets += 1

    for (const tag of options?.tags ?? []) {
      await this.command(['SADD', this.tagKey(tag), key])
      await this.command(['EXPIRE', this.tagKey(tag), REDIS_TAG_INDEX_TTL_SEC])
    }
  }

  async del(key: string | readonly string[]): Promise<void> {
    const keys = typeof key === 'string' ? [key] : key
    if (keys.length === 0) return
    await this.command(['DEL', ...keys])
    this.stats.deletes += keys.length
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      entries: null,
      hitRate: calculateHitRate(this.stats.hits, this.stats.misses),
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = this.tagKey(tag)
    const keys = await this.command<string[]>(['SMEMBERS', tagKey])
    if (keys.length > 0) {
      await this.del(keys)
    }
    await this.del(tagKey)
    this.stats.invalidations += 1
  }

  private tagKey(tag: string): string {
    return `${CACHE_KEY_PREFIX}:tag:${tag}`
  }

  private async command<T>(command: RedisCommand): Promise<T> {
    const response = await fetchWithCircuitBreaker('redis-distributed-cache', this.restUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Redis cache command failed with HTTP ${response.status}`)
    }

    const payload = (await response.json()) as UpstashRestPayload
    if (payload.error) {
      throw new Error(`Redis cache command failed: ${payload.error}`)
    }

    return payload.result as T
  }
}

export function createCacheAdapter(): CacheAdapter {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (restUrl && restToken) {
    return new UpstashRedisCacheAdapter(restUrl, restToken)
  }

  return new MemoryCacheAdapter()
}

function normalizeTtlSec(ttlSec: number): number {
  if (!Number.isFinite(ttlSec)) return 1
  return Math.max(1, Math.floor(ttlSec))
}

function createEmptyCacheStats(provider: CacheStats['provider']): CacheStats {
  return {
    deletes: 0,
    entries: provider === 'memory' ? 0 : null,
    hitRate: 0,
    hits: 0,
    invalidations: 0,
    misses: 0,
    provider,
    sets: 0,
  }
}

function calculateHitRate(hits: number, misses: number): number {
  const total = hits + misses
  return total > 0 ? Number(((hits / total) * 100).toFixed(2)) : 0
}

export const cache =
  globalCacheState.__soflia_cache_adapter__ ?? createCacheAdapter()

globalCacheState.__soflia_cache_adapter__ = cache

export function getCacheStats(): CacheStats {
  return cache.getStats()
}
