import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  updateStudyPlannerSessionsForUser,
} from '../study-planner-session-update.server.service'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('../../../dashboard/chat/calendar.service', () => ({
  syncSessionWithCalendar: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('../study-planner-session-update.db', () => ({
  getOwnedStudyPlan: vi.fn(),
  getStudySessionsForPlan: vi.fn(),
  updateStudySessionTimeWindow: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { syncSessionWithCalendar } from '../../../dashboard/chat/calendar.service'
import {
  getOwnedStudyPlan,
  getStudySessionsForPlan,
  updateStudySessionTimeWindow,
} from '../study-planner-session-update.db'

const EXPECTED_UPDATED_START = new Date(2026, 3, 10, 11, 0, 0, 0).toISOString()
const EXPECTED_UPDATED_END = new Date(2026, 3, 10, 12, 0, 0, 0).toISOString()

describe('study-planner-session-update.server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(),
    } as ReturnType<typeof createAdminClient>)
    vi.mocked(syncSessionWithCalendar).mockResolvedValue({ success: true })
  })

  it('returns plan_not_found when the plan does not belong to the user', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue(null)

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '11:00',
            newEndTime: '12:00',
          },
        ],
      },
    })

    expect(result).toEqual({ kind: 'plan_not_found' })
    expect(getStudySessionsForPlan).not.toHaveBeenCalled()
  })

  it('returns no_sessions when the plan has no study sessions', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([])

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '11:00',
            newEndTime: '12:00',
          },
        ],
      },
    })

    expect(result).toEqual({ kind: 'no_sessions' })
  })

  it('updates a session by id and returns summary metadata', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([
      {
        id: 'session-1',
        client_reference_id: 'dist-1',
        start_time: '2026-04-10T10:00:00.000Z',
        end_time: '2026-04-10T11:00:00.000Z',
      },
    ])

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            sessionId: 'session-1',
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '11:00',
            newEndTime: '12:00',
          },
        ],
      },
    })

    expect(updateStudySessionTimeWindow).toHaveBeenCalledWith(
      expect.any(Object),
      'session-1',
      'user-1',
      EXPECTED_UPDATED_START,
      EXPECTED_UPDATED_END,
    )
    expect(result).toEqual({
      kind: 'updated',
      updatedCount: 1,
      totalUpdates: 1,
      errors: [],
      updatedSessions: [
        {
          id: 'session-1',
          clientReferenceId: 'dist-1',
          title: undefined,
          startTime: EXPECTED_UPDATED_START,
          endTime: EXPECTED_UPDATED_END,
        },
      ],
    })
  })

  it('collects not found errors and keeps processing the rest of the batch', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([
      {
        id: 'session-1',
        client_reference_id: 'dist-1',
        start_time: '2026-04-10T10:00:00.000Z',
        end_time: '2026-04-10T11:00:00.000Z',
      },
    ])

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            dateStr: '2026-04-10',
            originalStartTime: '08:00',
            newStartTime: '09:00',
            newEndTime: '10:00',
          },
          {
            sessionId: 'session-1',
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '11:00',
            newEndTime: '12:00',
          },
        ],
      },
    })

    expect(updateStudySessionTimeWindow).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      kind: 'updated',
      updatedCount: 1,
      totalUpdates: 2,
      errors: ['No se encontro sesion para 2026-04-10 a las 08:00'],
      updatedSessions: [
        {
          id: 'session-1',
          clientReferenceId: 'dist-1',
          title: undefined,
          startTime: EXPECTED_UPDATED_START,
          endTime: EXPECTED_UPDATED_END,
        },
      ],
    })
  })

  it('returns validation errors for invalid time windows', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([
      {
        id: 'session-1',
        client_reference_id: 'dist-1',
        start_time: '2026-04-10T10:00:00.000Z',
        end_time: '2026-04-10T11:00:00.000Z',
      },
    ])

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            sessionId: 'session-1',
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '12:00',
            newEndTime: '11:00',
          },
        ],
      },
    })

    expect(updateStudySessionTimeWindow).not.toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'updated',
      updatedCount: 0,
      totalUpdates: 1,
      errors: ['Hora de fin debe ser posterior a hora de inicio para 2026-04-10'],
      updatedSessions: [],
    })
  })

  it('rejects updates that overlap another planned session', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([
      {
        id: 'session-1',
        client_reference_id: 'dist-1',
        start_time: '2026-04-10T10:00:00.000Z',
        end_time: '2026-04-10T11:00:00.000Z',
      },
      {
        id: 'session-2',
        client_reference_id: 'dist-2',
        title: 'Sesion 2',
        start_time: '2026-04-10T11:00:00.000Z',
        end_time: '2026-04-10T12:00:00.000Z',
      },
    ])

    const result = await updateStudyPlannerSessionsForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            sessionId: 'session-1',
            dateStr: '2026-04-10',
            originalStartTime: '10:00',
            newStartTime: '10:30',
            newEndTime: '11:30',
          },
        ],
      },
    })

    expect(updateStudySessionTimeWindow).not.toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'updated',
      updatedCount: 0,
      totalUpdates: 1,
      errors: ['La sesion session-1 se traslapa con Sesion 2'],
      updatedSessions: [],
    })
  })
})
