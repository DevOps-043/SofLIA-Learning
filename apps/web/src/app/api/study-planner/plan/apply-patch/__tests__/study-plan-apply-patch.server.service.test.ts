import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyStudyPlanPatchForUser } from '../study-plan-apply-patch.server.service'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('../../../sessions/update/study-planner-session-update.db', () => ({
  getOwnedStudyPlan: vi.fn(),
  getStudySessionsForPlan: vi.fn(),
}))

vi.mock(
  '../../../sessions/update/study-planner-session-update.server.service',
  () => ({
    updateStudyPlannerSessionsForUser: vi.fn(),
  }),
)

import { createAdminClient } from '@/lib/supabase/admin'
import {
  getOwnedStudyPlan,
  getStudySessionsForPlan,
} from '../../../sessions/update/study-planner-session-update.db'
import {
  updateStudyPlannerSessionsForUser,
} from '../../../sessions/update/study-planner-session-update.server.service'

describe('study-plan-apply-patch.server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(),
    } as ReturnType<typeof createAdminClient>)
  })

  it('expands move_session into a concrete session update', async () => {
    vi.mocked(getOwnedStudyPlan).mockResolvedValue({ id: 'plan-1' })
    vi.mocked(getStudySessionsForPlan).mockResolvedValue([
      {
        id: 'session-1',
        client_reference_id: 'dist-1',
        start_time: '2026-04-10T10:00:00.000Z',
        end_time: '2026-04-10T11:00:00.000Z',
      },
    ])
    vi.mocked(updateStudyPlannerSessionsForUser).mockResolvedValue({
      kind: 'updated',
      updatedCount: 1,
      totalUpdates: 1,
      errors: [],
      updatedSessions: [],
    })

    await applyStudyPlanPatchForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        operations: [
          {
            type: 'move_session',
            sessionId: 'session-1',
            targetDate: '2026-04-12',
            targetStartTime: '18:00',
            targetEndTime: '19:00',
          },
        ],
      },
    })

    expect(updateStudyPlannerSessionsForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            sessionId: 'session-1',
            clientReferenceId: 'dist-1',
            dateStr: '2026-04-12',
            originalStartTime: '10:00',
            newStartTime: '18:00',
            newEndTime: '19:00',
          },
        ],
      },
    })
  })

  it('expands move_day preserving the original session times', async () => {
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
        start_time: '2026-04-10T12:00:00.000Z',
        end_time: '2026-04-10T13:00:00.000Z',
      },
    ])
    vi.mocked(updateStudyPlannerSessionsForUser).mockResolvedValue({
      kind: 'updated',
      updatedCount: 2,
      totalUpdates: 2,
      errors: [],
      updatedSessions: [],
    })

    await applyStudyPlanPatchForUser({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        operations: [
          {
            type: 'move_day',
            sourceDate: '2026-04-10',
            targetDate: '2026-04-11',
          },
        ],
      },
    })

    expect(updateStudyPlannerSessionsForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      request: {
        planId: 'plan-1',
        updates: [
          {
            sessionId: 'session-1',
            clientReferenceId: 'dist-1',
            dateStr: '2026-04-11',
            originalStartTime: '10:00',
            newStartTime: '10:00',
            newEndTime: '11:00',
          },
          {
            sessionId: 'session-2',
            clientReferenceId: 'dist-2',
            dateStr: '2026-04-11',
            originalStartTime: '12:00',
            newStartTime: '12:00',
            newEndTime: '13:00',
          },
        ],
      },
    })
  })
})
