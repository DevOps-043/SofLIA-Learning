import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshCalendarAccessToken } from '../calendar-events-oauth.service'
import type { CalendarIntegrationRecord } from '../calendar-events.types'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeIntegration(
  provider: 'google' | 'microsoft' | 'unknown',
  overrides: Partial<CalendarIntegrationRecord> = {},
): CalendarIntegrationRecord {
  return {
    id: 'integration-1',
    user_id: 'user-1',
    provider,
    access_token: 'old-access-token',
    refresh_token: 'valid-refresh-token',
    expires_at: new Date(Date.now() - 1000).toISOString(),
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as CalendarIntegrationRecord
}

function makeSupabaseMock() {
  const updateChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
  const fromChain = { update: vi.fn().mockReturnValue(updateChain) }
  return {
    supabase: { from: vi.fn().mockReturnValue(fromChain) },
    updateChain,
    fromChain,
  }
}

// ─── google ──────────────────────────────────────────────────────────────────

describe('refreshCalendarAccessToken — Google provider', () => {
  beforeEach(() => {
    process.env.GOOGLE_CALENDAR_CLIENT_ID = 'google-client-id'
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'google-client-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GOOGLE_CALENDAR_CLIENT_ID
    delete process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  })

  it('returns success and new accessToken on happy path', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-google-token', expires_in: 3600 }), {
        status: 200,
      }),
    )
    const { supabase } = makeSupabaseMock()

    const result = await refreshCalendarAccessToken(supabase, makeIntegration('google'))

    expect(result).toEqual({ success: true, accessToken: 'new-google-token' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns failure when refresh_token is missing', async () => {
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(
      supabase,
      makeIntegration('google', { refresh_token: null }),
    )
    expect(result).toEqual({ success: false })
  })

  it('returns failure when OAuth credentials are missing', async () => {
    delete process.env.GOOGLE_CALENDAR_CLIENT_ID
    delete process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    delete process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_OAUTH_CLIENT_ID
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('google'))
    expect(result).toEqual({ success: false })
  })

  it('returns failure when fetch responds with non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 }),
    )
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('google'))
    expect(result).toEqual({ success: false })
  })

  it('returns failure when response body has no access_token', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 200 }),
    )
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('google'))
    expect(result).toEqual({ success: false })
  })

  it('returns failure when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('google'))
    expect(result).toEqual({ success: false })
  })

  it('updates supabase with new token data on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-token', expires_in: 3600 }), {
        status: 200,
      }),
    )
    const { supabase, fromChain, updateChain } = makeSupabaseMock()

    await refreshCalendarAccessToken(supabase, makeIntegration('google'))

    expect(supabase.from).toHaveBeenCalledWith('calendar_integrations')
    expect(fromChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'new-token' }),
    )
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'integration-1')
  })
})

// ─── microsoft ───────────────────────────────────────────────────────────────

describe('refreshCalendarAccessToken — Microsoft provider', () => {
  beforeEach(() => {
    process.env.MICROSOFT_CALENDAR_CLIENT_ID = 'ms-client-id'
    process.env.MICROSOFT_CALENDAR_CLIENT_SECRET = 'ms-client-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.MICROSOFT_CALENDAR_CLIENT_ID
    delete process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
  })

  it('returns success and new accessToken on happy path', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-ms-token', expires_in: 3600 }), {
        status: 200,
      }),
    )
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('microsoft'))
    expect(result).toEqual({ success: true, accessToken: 'new-ms-token' })
  })

  it('returns failure when credentials are missing', async () => {
    delete process.env.MICROSOFT_CALENDAR_CLIENT_ID
    delete process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
    delete process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID
    delete process.env.MICROSOFT_CLIENT_ID
    delete process.env.MICROSOFT_OAUTH_CLIENT_ID
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(supabase, makeIntegration('microsoft'))
    expect(result).toEqual({ success: false })
  })

  it('calls microsoft token endpoint', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'new-ms-token' }), { status: 200 }),
    )
    const { supabase } = makeSupabaseMock()
    await refreshCalendarAccessToken(supabase, makeIntegration('microsoft'))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

// ─── unknown provider ────────────────────────────────────────────────────────

describe('refreshCalendarAccessToken — unknown provider', () => {
  it('returns failure for unrecognized provider', async () => {
    const { supabase } = makeSupabaseMock()
    const result = await refreshCalendarAccessToken(
      supabase,
      makeIntegration('unknown' as 'google'),
    )
    expect(result).toEqual({ success: false })
  })
})
