import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildStudyPlannerSessionsResponse,
  syncStudyPlannerSessionsCalendarState,
} from '../study-planner-sessions.server.service'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('../study-planner-sessions.db', () => ({
  getLatestStudyPlanId: vi.fn(),
  getStudySessionsForRange: vi.fn(),
}))

vi.mock('@/app/api/study-planner/calendar/events/calendar-events.db', () => ({
  getLatestCalendarIntegration: vi.fn(),
}))

vi.mock('@/app/api/study-planner/calendar/events/calendar-events-oauth.service', () => ({
  refreshCalendarAccessToken: vi.fn(),
}))

vi.mock('@/app/api/study-planner/calendar/events/calendar-events-sync.service', () => ({
  syncDeletedStudySessions: vi.fn(),
}))

vi.mock('@/app/api/study-planner/calendar/events/calendar-events.utils', () => ({
  needsCalendarTokenRefresh: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import {
  getLatestCalendarIntegration,
} from '@/app/api/study-planner/calendar/events/calendar-events.db'
import { refreshCalendarAccessToken } from '@/app/api/study-planner/calendar/events/calendar-events-oauth.service'
import { syncDeletedStudySessions } from '@/app/api/study-planner/calendar/events/calendar-events-sync.service'
import { needsCalendarTokenRefresh } from '@/app/api/study-planner/calendar/events/calendar-events.utils'
import {
  getLatestStudyPlanId,
  getStudySessionsForRange,
} from '../study-planner-sessions.db'

const START = new Date('2026-04-01T00:00:00.000Z')
const END = new Date('2026-04-30T00:00:00.000Z')

describe('study-planner-sessions.server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(),
    } as ReturnType<typeof createAdminClient>)
  })

  it('returns an empty payload when the user has no active plan', async () => {
    vi.mocked(getLatestStudyPlanId).mockResolvedValue(null)

    const result = await buildStudyPlannerSessionsResponse({
      userId: 'user-1',
      startDate: START,
      endDate: END,
    })

    expect(result).toEqual({
      sessions: [],
      startDate: START.toISOString(),
      endDate: END.toISOString(),
      totalSessions: 0,
      hasActivePlan: false,
    })
    expect(getStudySessionsForRange).not.toHaveBeenCalled()
  })

  it('loads sessions for the latest plan and returns summary metadata', async () => {
    vi.mocked(getLatestStudyPlanId).mockResolvedValue('plan-1')
    vi.mocked(getLatestCalendarIntegration).mockResolvedValue(null)
    vi.mocked(getStudySessionsForRange).mockResolvedValue([
      {
        id: 'session-1',
        title: 'Repaso',
        description: null,
        start_time: '2026-04-02T10:00:00.000Z',
        end_time: '2026-04-02T11:00:00.000Z',
        status: 'planned',
        course_id: 'course-1',
        lesson_id: null,
        is_ai_generated: true,
        session_type: 'study',
        external_event_id: null,
        calendar_provider: null,
      },
    ])

    const result = await buildStudyPlannerSessionsResponse({
      userId: 'user-1',
      startDate: START,
      endDate: END,
    })

    expect(getStudySessionsForRange).toHaveBeenCalledWith(
      expect.any(Object),
      {
        userId: 'user-1',
        planId: 'plan-1',
        startDate: START,
        endDate: END,
      },
    )
    expect(result).toMatchObject({
      totalSessions: 1,
      hasActivePlan: true,
    })
  })

  it('syncs deleted calendar sessions with the current access token when it is still valid', async () => {
    const supabase = { from: vi.fn() } as ReturnType<typeof createAdminClient>
    vi.mocked(getLatestCalendarIntegration).mockResolvedValue({
      id: 'integration-1',
      user_id: 'user-1',
      provider: 'google',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: '2026-04-20T00:00:00.000Z',
      metadata: null,
    })
    vi.mocked(needsCalendarTokenRefresh).mockReturnValue(false)

    await syncStudyPlannerSessionsCalendarState({
      supabase,
      userId: 'user-1',
      startDate: START,
      endDate: END,
    })

    expect(syncDeletedStudySessions).toHaveBeenCalledWith(
      supabase,
      'user-1',
      START,
      END,
      'access-token',
      expect.objectContaining({ id: 'integration-1' }),
    )
    expect(refreshCalendarAccessToken).not.toHaveBeenCalled()
  })

  it('refreshes the token before syncing when the integration is expired', async () => {
    const supabase = { from: vi.fn() } as ReturnType<typeof createAdminClient>
    vi.mocked(getLatestCalendarIntegration).mockResolvedValue({
      id: 'integration-1',
      user_id: 'user-1',
      provider: 'google',
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: '2026-04-01T00:00:00.000Z',
      metadata: null,
    })
    vi.mocked(needsCalendarTokenRefresh).mockReturnValue(true)
    vi.mocked(refreshCalendarAccessToken).mockResolvedValue({
      success: true,
      accessToken: 'fresh-token',
    })

    await syncStudyPlannerSessionsCalendarState({
      supabase,
      userId: 'user-1',
      startDate: START,
      endDate: END,
    })

    expect(refreshCalendarAccessToken).toHaveBeenCalled()
    expect(syncDeletedStudySessions).toHaveBeenCalledWith(
      supabase,
      'user-1',
      START,
      END,
      'fresh-token',
      expect.objectContaining({ id: 'integration-1' }),
    )
  })

  it('skips the sync when the token refresh fails', async () => {
    const supabase = { from: vi.fn() } as ReturnType<typeof createAdminClient>
    vi.mocked(getLatestCalendarIntegration).mockResolvedValue({
      id: 'integration-1',
      user_id: 'user-1',
      provider: 'google',
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: '2026-04-01T00:00:00.000Z',
      metadata: null,
    })
    vi.mocked(needsCalendarTokenRefresh).mockReturnValue(true)
    vi.mocked(refreshCalendarAccessToken).mockResolvedValue({
      success: false,
    })

    await syncStudyPlannerSessionsCalendarState({
      supabase,
      userId: 'user-1',
      startDate: START,
      endDate: END,
    })

    expect(syncDeletedStudySessions).not.toHaveBeenCalled()
  })
})
