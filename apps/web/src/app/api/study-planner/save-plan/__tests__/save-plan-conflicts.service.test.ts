import { describe, expect, it, vi } from 'vitest'
import {
  findExistingStudySessionConflict,
  findInPayloadSessionConflict,
} from '../save-plan-conflicts.service'
import type { createAdminClient } from '../save-plan-organization.service'
import type { SavePlanSessionInsertRow } from '../save-plan.types'

function makeSession(
  overrides: Partial<SavePlanSessionInsertRow>,
): SavePlanSessionInsertRow {
  return {
    organization_id: null,
    plan_id: 'new-plan',
    user_id: 'user-1',
    title: 'Sesion nueva',
    description: null,
    course_id: 'course-1',
    lesson_id: null,
    start_time: '2026-05-04T10:00:00.000Z',
    end_time: '2026-05-04T11:00:00.000Z',
    status: 'planned',
    is_ai_generated: true,
    session_type: 'medium',
    metrics: {
      plannedCourseId: 'course-1',
    },
    ...overrides,
  }
}

function makeSupabaseMock(rows: unknown[]) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockResolvedValue({ data: rows, error: null }),
  }

  return {
    from: vi.fn().mockReturnValue(query),
    query,
  }
}

describe('save-plan-conflicts.service', () => {
  it('detects overlapping sessions inside the plan payload', () => {
    const conflict = findInPayloadSessionConflict([
      makeSession({
        title: 'Leccion A',
        start_time: '2026-05-04T10:00:00.000Z',
        end_time: '2026-05-04T11:00:00.000Z',
      }),
      makeSession({
        title: 'Leccion B',
        start_time: '2026-05-04T10:30:00.000Z',
        end_time: '2026-05-04T11:30:00.000Z',
      }),
    ])

    expect(conflict).toMatchObject({
      candidateTitle: 'Leccion B',
      conflictingTitle: 'Leccion A',
    })
  })

  it('detects overlap with an existing active study session', async () => {
    const supabaseMock = makeSupabaseMock([
      {
        id: 'existing-session',
        plan_id: 'existing-plan',
        title: 'Taller existente',
        start_time: '2026-05-04T10:30:00.000Z',
        end_time: '2026-05-04T11:30:00.000Z',
        status: 'planned',
      },
    ])

    const conflict = await findExistingStudySessionConflict({
      supabase: supabaseMock as unknown as ReturnType<typeof createAdminClient>,
      userId: 'user-1',
      sessions: [
        makeSession({
          title: 'Taller nuevo',
          start_time: '2026-05-04T10:00:00.000Z',
          end_time: '2026-05-04T11:00:00.000Z',
        }),
      ],
    })

    expect(conflict).toMatchObject({
      candidateTitle: 'Taller nuevo',
      conflictingTitle: 'Taller existente',
    })
    expect(supabaseMock.from).toHaveBeenCalledWith('study_sessions')
  })

  it('ignores cancelled existing sessions when checking conflicts', async () => {
    const supabaseMock = makeSupabaseMock([
      {
        id: 'cancelled-session',
        plan_id: 'old-plan',
        title: 'Sesion cancelada',
        start_time: '2026-05-04T10:30:00.000Z',
        end_time: '2026-05-04T11:30:00.000Z',
        status: 'cancelled',
      },
    ])

    await expect(
      findExistingStudySessionConflict({
        supabase: supabaseMock as unknown as ReturnType<typeof createAdminClient>,
        userId: 'user-1',
        sessions: [makeSession({ title: 'Sesion valida' })],
      }),
    ).resolves.toBeNull()
  })
})
