import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncDeletedStudySessions } from '../calendar-events-sync.service'
import type { CalendarIntegrationRecord } from '../calendar-events.types'

vi.mock('../calendar-events-provider.service', () => ({
  getGoogleCalendarEvents: vi.fn(),
  getMicrosoftCalendarEvents: vi.fn(),
}))

import {
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
} from '../calendar-events-provider.service'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeIntegration(
  provider: 'google' | 'microsoft' = 'google',
  overrides: Partial<CalendarIntegrationRecord> = {},
): CalendarIntegrationRecord {
  return {
    id: 'integration-1',
    user_id: 'user-1',
    provider,
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as CalendarIntegrationRecord
}

function makeExternalEvent(id: string) {
  return {
    id,
    title: 'Event',
    description: '',
    start: '2026-04-05T10:00:00.000Z',
    end: '2026-04-05T11:00:00.000Z',
    location: '',
    status: 'confirmed',
    isAllDay: false,
  }
}

function makeSupabase(sessions: Array<{ id: string; external_event_id: string }> = []) {
  const updateChain = {
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  }
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockResolvedValue({ data: sessions, error: null }),
  }
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'study_sessions') {
          return { select: vi.fn().mockReturnValue(selectChain), update: vi.fn().mockReturnValue(updateChain) }
        }
        return {}
      }),
    },
    updateChain,
  }
}

const START = new Date('2026-04-01T00:00:00.000Z')
const END = new Date('2026-04-15T00:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── tests ───────────────────────────────────────────────────────────────────

describe('syncDeletedStudySessions', () => {
  it('returns early when there are no sessions with external_event_id', async () => {
    const { supabase, updateChain } = makeSupabase([])
    vi.mocked(getGoogleCalendarEvents).mockResolvedValue([])

    await syncDeletedStudySessions(supabase, 'user-1', START, END, 'token', makeIntegration())

    expect(updateChain.in).not.toHaveBeenCalled()
  })

  it('does not update when all sessions still exist in external calendar', async () => {
    const { supabase, updateChain } = makeSupabase([
      { id: 'session-1', external_event_id: 'event-1' },
    ])
    vi.mocked(getGoogleCalendarEvents).mockResolvedValue([makeExternalEvent('event-1')])

    await syncDeletedStudySessions(supabase, 'user-1', START, END, 'token', makeIntegration())

    expect(updateChain.in).not.toHaveBeenCalled()
  })

  it('clears external_event_id for sessions whose events were deleted', async () => {
    const sessions = [
      { id: 'session-1', external_event_id: 'event-deleted' },
      { id: 'session-2', external_event_id: 'event-existing' },
    ]
    const { supabase, updateChain } = makeSupabase(sessions)
    vi.mocked(getGoogleCalendarEvents).mockResolvedValue([makeExternalEvent('event-existing')])

    await syncDeletedStudySessions(supabase, 'user-1', START, END, 'token', makeIntegration())

    expect(updateChain.in).toHaveBeenCalledWith('id', ['session-1'])
  })

  it('uses getMicrosoftCalendarEvents for microsoft provider', async () => {
    const { supabase } = makeSupabase([{ id: 'session-1', external_event_id: 'event-1' }])
    vi.mocked(getMicrosoftCalendarEvents).mockResolvedValue([makeExternalEvent('event-1')])

    await syncDeletedStudySessions(
      supabase,
      'user-1',
      START,
      END,
      'token',
      makeIntegration('microsoft'),
    )

    expect(getMicrosoftCalendarEvents).toHaveBeenCalled()
    expect(getGoogleCalendarEvents).not.toHaveBeenCalled()
  })

  it('swallows errors from provider without rethrowing', async () => {
    const { supabase } = makeSupabase([{ id: 'session-1', external_event_id: 'event-1' }])
    vi.mocked(getGoogleCalendarEvents).mockRejectedValue(new Error('Provider down'))

    await expect(
      syncDeletedStudySessions(supabase, 'user-1', START, END, 'token', makeIntegration()),
    ).resolves.toBeUndefined()
  })
})
