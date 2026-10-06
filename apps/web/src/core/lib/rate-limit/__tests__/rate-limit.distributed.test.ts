import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/resilience/circuit-breaker', () => ({ fetchWithCircuitBreaker: mocks.fetch }))
vi.mock('@/lib/utils/logger', () => ({ logger: { error: mocks.error } }))

const config = { maxRequests: 20, burst: 5, windowMs: 60_000 }
const request = new NextRequest('https://soflia.test/api/lia/chat', { method: 'POST' })

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'production')
  for (const name of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_URL', 'REDIS_REST_TOKEN', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    vi.stubEnv(name, '')
  }
})
afterEach(() => vi.unstubAllEnvs())

describe('distributed chat rate limit availability', () => {
  it('keeps chat fail-closed when neither distributed backend is configured', async () => {
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    const result = await checkDistributedRateLimit(request, config, 'ai-chat')

    expect(result.response?.status).toBe(503)
    expect(await result.response?.json()).toEqual({ error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' })
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith('Distributed rate limiter unavailable', {
      prefix: 'ai-chat', reason: 'SUPABASE_RATE_LIMIT_UNAVAILABLE',
    })
  })

  it('logs provider failure without including Redis secrets', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'secret-token')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-secret')
    mocks.fetch.mockRejectedValue(new Error('provider failure: secret-token'))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    const result = await checkDistributedRateLimit(request, config, 'ai-chat')

    expect(result.response?.status).toBe(503)
    expect(mocks.error).toHaveBeenCalledWith('Distributed rate limiter unavailable', {
      prefix: 'ai-chat', reason: 'REDIS_REQUEST_FAILED',
    })
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('secret-token')
    // A Redis outage must not grant a fresh budget from a different store.
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('allows chat when Redis confirms the distributed budget', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'secret-token')
    mocks.fetch.mockResolvedValueOnce(Response.json({ result: 2 }))
      .mockResolvedValueOnce(Response.json({ result: 59_000 }))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    const result = await checkDistributedRateLimit(request, config, 'ai-chat')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(23)
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('uses one atomic Supabase RPC with pseudonymous keys when Redis is absent', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example/')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-secret')
    mocks.fetch.mockResolvedValue(Response.json([
      { request_count: 2, reset_at: new Date(Date.now() + 60_000).toISOString() },
    ]))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    const result = await checkDistributedRateLimit(request, config, 'ai-chat')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(23)
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    const [backend, url, options] = mocks.fetch.mock.calls[0]
    expect(backend).toBe('supabase-rate-limit')
    expect(url).toBe('https://supabase.example/rest/v1/rpc/check_distributed_rate_limit')
    expect(options.cache).toBe('no-store')
    expect(JSON.parse(options.body)).toEqual({
      p_key: expect.stringMatching(/^soflia:rate-limit:v1:ai-chat:[a-f0-9]{32}$/),
      p_limit: 25, p_window_ms: 60_000,
    })
  })

  it('returns 429 with retry headers when Supabase denies the shared budget', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-secret')
    mocks.fetch.mockResolvedValue(Response.json([
      { request_count: 26, reset_at: new Date(Date.now() + 60_000).toISOString() },
    ]))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    const result = await checkDistributedRateLimit(request, config, 'ai-chat')
    expect(result.response?.status).toBe(429)
    expect(result.response?.headers.get('X-RateLimit-Limit')).toBe('25')
    expect(result.response?.headers.get('Retry-After')).toBeTruthy()
  })

  it.each([
    [],
    [{ request_count: '1', reset_at: new Date().toISOString() }],
    [{ request_count: 0, reset_at: new Date().toISOString() }],
    [{ request_count: 1, reset_at: 'invalid' }],
  ].map((payload) => ({ payload })))('fails closed on malformed Supabase responses (%j)', async ({ payload }) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-secret')
    mocks.fetch.mockResolvedValue(Response.json(payload))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    expect((await checkDistributedRateLimit(request, config, 'ai-chat')).response?.status).toBe(503)
  })

  it('fails closed when Supabase times out or rejects the RPC', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-secret')
    mocks.fetch.mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(Response.json({ error: 'function missing' }, { status: 404 }))
    const { checkDistributedRateLimit } = await import('../rate-limit.distributed')
    for (let attempt = 0; attempt < 2; attempt++) {
      expect((await checkDistributedRateLimit(request, config, 'ai-chat')).response?.status).toBe(503)
    }
  })
});
