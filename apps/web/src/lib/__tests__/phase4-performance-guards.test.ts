import { describe, expect, it } from 'vitest'
import {
  MemoryCacheAdapter,
  buildTenantCacheKey,
  buildUserCacheKey,
} from '../cache'
import {
  buildPaginationMetadata,
  parseOffsetPaginationParams,
  parsePaginationParams,
} from '../api/pagination'
import {
  isBodySizeGuardedPath,
  parseContentLength,
} from '../api/request-size'
import {
  measureResponseSizeBytes,
  parseResponseContentLength,
} from '../api/response-size'
import { auditSupabasePaginationSource } from '../api/supabase-pagination-audit'
import {
  QUEUE_RETRY_ATTEMPTS,
  QUEUE_RETRY_DELAY_EXPRESSION,
} from '../queue'

describe('distributed cache adapter contract', () => {
  it('stores values with TTL and deletes expired entries', async () => {
    const adapter = new MemoryCacheAdapter()
    await adapter.set('phase4:ttl', { ok: true }, 1)

    expect(await adapter.get<{ ok: boolean }>('phase4:ttl')).toEqual({ ok: true })
    await adapter.del('phase4:ttl')
    expect(await adapter.get('phase4:ttl')).toBeNull()
  })

  it('invalidates all keys associated with a tag', async () => {
    const adapter = new MemoryCacheAdapter()
    await adapter.set('phase4:a', 'A', 60, { tags: ['org:1'] })
    await adapter.set('phase4:b', 'B', 60, { tags: ['org:1'] })
    await adapter.set('phase4:c', 'C', 60, { tags: ['org:2'] })

    await adapter.invalidateByTag('org:1')

    expect(await adapter.get('phase4:a')).toBeNull()
    expect(await adapter.get('phase4:b')).toBeNull()
    expect(await adapter.get('phase4:c')).toBe('C')
  })

  it('reports hit and miss metrics for runtime dashboards', async () => {
    const adapter = new MemoryCacheAdapter()
    await adapter.set('phase4:stats', 'cached', 60)

    expect(await adapter.get('phase4:stats')).toBe('cached')
    expect(await adapter.get('phase4:missing')).toBeNull()

    expect(adapter.getStats()).toMatchObject({
      entries: 1,
      hitRate: 50,
      hits: 1,
      misses: 1,
      provider: 'memory',
      sets: 1,
    })
  })

  it('builds tenant and user keys with the SofLIA prefix', () => {
    expect(
      buildTenantCacheKey({
        orgId: 'org-1',
        resourceType: 'courses',
        id: 'course-1',
      }),
    ).toBe('soflia:tenant:org-1:resource:courses:course-1')

    expect(
      buildUserCacheKey({
        userId: 'user-1',
        resourceType: 'study-planner',
        variant: 'week',
      }),
    ).toBe('soflia:user:user-1:resource:study-planner:week')
  })
})

describe('pagination helpers', () => {
  it('caps page size at the platform maximum', () => {
    const params = new URLSearchParams({ page: '3', pageSize: '999' })
    expect(parsePaginationParams(params)).toEqual({
      page: 3,
      pageSize: 100,
      rangeFrom: 200,
      rangeTo: 299,
    })
  })

  it('normalizes offset pagination to a bounded range', () => {
    const params = new URLSearchParams({ limit: '250', offset: '40' })
    expect(parseOffsetPaginationParams(params)).toEqual({
      limit: 100,
      offset: 40,
      rangeFrom: 40,
      rangeTo: 139,
    })
  })

  it('builds stable metadata for empty collections', () => {
    expect(buildPaginationMetadata(1, 50, 0)).toEqual({
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
    })
  })
})

describe('request body size guard', () => {
  it('guards standard API routes and exempts upload/import routes', () => {
    expect(isBodySizeGuardedPath('/api/lia/chat')).toBe(true)
    expect(isBodySizeGuardedPath('/api/admin/upload/course-videos')).toBe(false)
    expect(isBodySizeGuardedPath('/api/business/users/import')).toBe(false)
  })

  it('parses valid content-length values defensively', () => {
    expect(parseContentLength('1048577')).toBe(1_048_577)
    expect(parseContentLength('-1')).toBeNull()
    expect(parseContentLength('not-a-number')).toBeNull()
    expect(parseContentLength(null)).toBeNull()
  })
})

describe('response payload metrics', () => {
  it('parses declared response sizes and measures JSON responses', async () => {
    expect(parseResponseContentLength('2048')).toBe(2048)
    expect(parseResponseContentLength('invalid')).toBeNull()

    const response = Response.json({ ok: true })
    expect(await measureResponseSizeBytes(response)).toBeGreaterThan(0)
  })

  it('does not buffer streaming responses for size metrics', async () => {
    const response = new Response(new ReadableStream(), {
      headers: { 'Content-Type': 'text/event-stream' },
    })

    expect(await measureResponseSizeBytes(response)).toBeNull()
  })
})

describe('Supabase pagination audit', () => {
  it('flags array selects without a range or limit', () => {
    const source = `
      const { data } = await supabase
        .from('users')
        .select('id, email')
        .eq('organization_id', orgId)
    `

    expect(auditSupabasePaginationSource(source)).toHaveLength(1)
  })

  it('accepts bounded and singular selects', () => {
    const source = `
      await supabase.from('users').select('id').range(0, 49)
      await supabase.from('users').select('id').single()
      await supabase.from('users').select('id').maybeSingle<UserRow>()
      await supabase.from('users').select('id', { count: 'exact', head: true })
    `

    expect(auditSupabasePaginationSource(source)).toHaveLength(0)
  })
})

describe('queue policy', () => {
  it('keeps the required retry policy for heavy jobs', () => {
    expect(QUEUE_RETRY_ATTEMPTS).toBe(3)
    expect(QUEUE_RETRY_DELAY_EXPRESSION).toBe('1000 * pow(4, retried)')
  })
})
