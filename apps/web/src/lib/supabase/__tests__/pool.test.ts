import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn((url: string, key: string, options: unknown) => ({
  url,
  key,
  options,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

describe('SupabaseConnectionPool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reuses the same client for identical credentials', async () => {
    const { createSupabaseConnectionPool } = await import('../pool')
    const pool = createSupabaseConnectionPool(2)

    const firstClient = pool.getClient('https://example.supabase.co', 'anon')
    const secondClient = pool.getClient('https://example.supabase.co', 'anon')

    expect(firstClient).toBe(secondClient)
    expect(createClientMock).toHaveBeenCalledTimes(1)
    expect(pool.getStats()).toMatchObject({
      hits: 1,
      misses: 1,
      connections: 1,
    })
  })

  it('evicts the oldest client when the pool reaches the configured size', async () => {
    const { createSupabaseConnectionPool } = await import('../pool')
    const pool = createSupabaseConnectionPool(1)

    const firstClient = pool.getClient('https://one.supabase.co', 'anon-1')
    const secondClient = pool.getClient('https://two.supabase.co', 'anon-2')
    const recreatedFirstClient = pool.getClient('https://one.supabase.co', 'anon-1')

    expect(firstClient).not.toBe(secondClient)
    expect(recreatedFirstClient).not.toBe(firstClient)
    expect(createClientMock).toHaveBeenCalledTimes(3)
    expect(pool.getStats().connections).toBe(1)
  })
})
