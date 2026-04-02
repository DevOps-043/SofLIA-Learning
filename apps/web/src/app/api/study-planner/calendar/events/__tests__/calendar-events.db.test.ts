import { describe, expect, it, vi } from 'vitest'
import {
  createCalendarAdminClient,
  getActiveStudySessionEventIds,
  getLatestCalendarIntegration,
  getOrphanedCalendarEventIds,
} from '../calendar-events.db'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

// ─── helpers ────────────────────────────────────────────────────────────────

function makeSupabaseChain(result: { data?: unknown; error?: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
  return { from: vi.fn().mockReturnValue(chain), chain }
}

function makeCalendarIntegration() {
  return {
    id: 'integration-1',
    user_id: 'user-1',
    provider: 'google' as const,
    access_token: 'token',
    refresh_token: 'refresh',
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ─── createCalendarAdminClient ────────────────────────────────────────────────

describe('createCalendarAdminClient', () => {
  it('throws when supabase env vars are missing', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    expect(() => createCalendarAdminClient()).toThrow(
      'Variables de Supabase no configuradas',
    )

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })

  it('returns a supabase client when env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

    const client = createCalendarAdminClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })
})

// ─── getLatestCalendarIntegration ────────────────────────────────────────────

describe('getLatestCalendarIntegration', () => {
  it('returns the first record when found', async () => {
    const integration = makeCalendarIntegration()
    const { from, chain } = makeSupabaseChain({ data: [integration], error: null })

    const result = await getLatestCalendarIntegration({ from }, 'user-1')

    expect(result).toEqual(integration)
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(1)
  })

  it('returns null when no records found', async () => {
    const { from } = makeSupabaseChain({ data: [], error: null })

    const result = await getLatestCalendarIntegration({ from }, 'user-1')

    expect(result).toBeNull()
  })

  it('returns null when query returns error', async () => {
    const { from } = makeSupabaseChain({ data: null, error: { message: 'DB error' } })

    const result = await getLatestCalendarIntegration({ from }, 'user-1')

    expect(result).toBeNull()
  })
})

// ─── getActiveStudySessionEventIds ───────────────────────────────────────────

describe('getActiveStudySessionEventIds', () => {
  it('returns a Set of normalized external event ids', async () => {
    const sessions = [
      { external_event_id: 'event-1_abc', calendar_provider: 'google' },
      { external_event_id: 'event-2', calendar_provider: 'google' },
    ]
    // chain: .select().eq('user_id').not().eq('calendar_provider') -> resolves
    const chain = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      eq: vi.fn()
        .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: sessions }) })
        .mockResolvedValue({ data: sessions }),
    }
    // Simpler: mock the full chain where each call returns `this` except the last eq
    const finalChain = {
      select: vi.fn(),
      eq: vi.fn(),
      not: vi.fn(),
    }
    finalChain.select.mockReturnValue(finalChain)
    finalChain.not.mockReturnValue(finalChain)
    finalChain.eq
      .mockReturnValueOnce(finalChain)          // first .eq('user_id', ...)
      .mockResolvedValueOnce({ data: sessions }) // second .eq('calendar_provider', ...)
    const supabase = { from: vi.fn().mockReturnValue(finalChain) }

    const result = await getActiveStudySessionEventIds(supabase, 'user-1', 'google')

    expect(result).toBeInstanceOf(Set)
    expect(result.has('event-1')).toBe(true)
    expect(result.has('event-2')).toBe(true)
  })

  it('returns empty Set when no sessions have external_event_id', async () => {
    const chain = { select: vi.fn(), eq: vi.fn(), not: vi.fn() }
    chain.select.mockReturnValue(chain)
    chain.not.mockReturnValue(chain)
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: [] })
    const supabase = { from: vi.fn().mockReturnValue(chain) }

    const result = await getActiveStudySessionEventIds(supabase, 'user-1', 'google')

    expect(result.size).toBe(0)
  })

  it('returns empty Set when data is null', async () => {
    const chain = { select: vi.fn(), eq: vi.fn(), not: vi.fn() }
    chain.select.mockReturnValue(chain)
    chain.not.mockReturnValue(chain)
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null })
    const supabase = { from: vi.fn().mockReturnValue(chain) }

    const result = await getActiveStudySessionEventIds(supabase, 'user-1', 'google')

    expect(result.size).toBe(0)
  })
})

// ─── getOrphanedCalendarEventIds ─────────────────────────────────────────────

describe('getOrphanedCalendarEventIds', () => {
  it('returns event ids not present in activeEventIds (google)', async () => {
    const events = [
      { google_event_id: 'active-event' },
      { google_event_id: 'orphan-event' },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: events }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) }
    const activeIds = new Set(['active-event'])

    const result = await getOrphanedCalendarEventIds(supabase, 'user-1', 'google', activeIds)

    expect(result).toBeInstanceOf(Set)
    expect(result.has('orphan-event')).toBe(true)
    expect(result.has('active-event')).toBe(false)
  })

  it('uses microsoft_event_id column for microsoft provider', async () => {
    const events = [{ microsoft_event_id: 'ms-orphan' }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: events }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) }

    const result = await getOrphanedCalendarEventIds(supabase, 'user-1', 'microsoft', new Set())

    expect(result.has('ms-orphan')).toBe(true)
    expect(chain.select).toHaveBeenCalledWith('microsoft_event_id')
  })

  it('returns empty Set when all events are active', async () => {
    const events = [{ google_event_id: 'event-1' }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: events }),
    }
    const supabase = { from: vi.fn().mockReturnValue(chain) }
    const activeIds = new Set(['event-1'])

    const result = await getOrphanedCalendarEventIds(supabase, 'user-1', 'google', activeIds)

    expect(result.size).toBe(0)
  })
})
