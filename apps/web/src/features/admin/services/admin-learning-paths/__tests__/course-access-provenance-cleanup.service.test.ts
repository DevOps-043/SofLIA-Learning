import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import {
  forceRevokeCourseAccess,
  revokeCourseAccessSourcedFromLearningPath,
} from '../course-access-provenance-cleanup.service'

interface QueryResult {
  data: unknown
  error: unknown
}

function createChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'in', 'delete']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

function createSupabaseMock(resultsByTable: Record<string, QueryResult[]>) {
  const chains: Record<string, ReturnType<typeof createChain>[]> = {}
  const from = vi.fn((table: string) => {
    const queue = resultsByTable[table]
    const result = queue?.shift() ?? { data: [], error: null }
    const chain = createChain(result)
    chains[table] = [...(chains[table] || []), chain]
    return chain
  })
  return { from, chains }
}

describe('revokeCourseAccessSourcedFromLearningPath', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
  })

  it('returns an empty result without querying enrollments when there are no matching assignment rows', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [{ data: [], error: null }],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await revokeCourseAccessSourcedFromLearningPath({
      learningPathId: 'lp-1',
    })

    expect(result).toEqual({ revokedCount: 0, keptWithProgress: [] })
    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
    expect(supabaseMock.from).not.toHaveBeenCalledWith('user_course_enrollments')
  })

  it('auto-revokes assignments with zero progress', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [
        {
          data: [
            {
              id: 'assignment-1',
              user_id: 'user-1',
              organization_id: 'org-1',
              course_id: 'course-1',
              courses: { title: 'Curso A' },
            },
          ],
          error: null,
        },
        { data: [{ id: 'assignment-1' }], error: null }, // delete().in() response
      ],
      user_course_enrollments: [
        {
          data: [
            { user_id: 'user-1', course_id: 'course-1', organization_id: 'org-1', overall_progress_percentage: 0 },
          ],
          error: null,
        },
      ],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await revokeCourseAccessSourcedFromLearningPath({
      learningPathId: 'lp-1',
      userId: 'user-1',
      organizationId: 'org-1',
    })

    expect(result).toEqual({ revokedCount: 1, keptWithProgress: [] })
    // First call to organization_course_assignments loads candidates, second performs the delete.
    expect(supabaseMock.chains.organization_course_assignments).toHaveLength(2)
    expect(supabaseMock.chains.organization_course_assignments[1].delete).toHaveBeenCalled()
  })

  it('treats a missing enrollment row as zero progress and auto-revokes it', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [
        {
          data: [
            {
              id: 'assignment-1',
              user_id: 'user-1',
              organization_id: 'org-1',
              course_id: 'course-1',
              courses: { title: 'Curso A' },
            },
          ],
          error: null,
        },
        { data: [{ id: 'assignment-1' }], error: null },
      ],
      user_course_enrollments: [{ data: [], error: null }],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await revokeCourseAccessSourcedFromLearningPath({ learningPathId: 'lp-1' })

    expect(result.revokedCount).toBe(1)
    expect(result.keptWithProgress).toEqual([])
  })

  it('keeps assignments with real progress and reports them instead of deleting', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [
        {
          data: [
            {
              id: 'assignment-1',
              user_id: 'user-1',
              organization_id: 'org-1',
              course_id: 'course-1',
              courses: { title: 'Curso con avance' },
            },
          ],
          error: null,
        },
      ],
      user_course_enrollments: [
        {
          data: [
            { user_id: 'user-1', course_id: 'course-1', organization_id: 'org-1', overall_progress_percentage: 45 },
          ],
          error: null,
        },
      ],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await revokeCourseAccessSourcedFromLearningPath({ learningPathId: 'lp-1' })

    expect(result).toEqual({
      revokedCount: 0,
      keptWithProgress: [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          courseId: 'course-1',
          courseTitle: 'Curso con avance',
          progressPercentage: 45,
        },
      ],
    })
    // Only the read call to organization_course_assignments happened, no delete.
    expect(supabaseMock.chains.organization_course_assignments).toHaveLength(1)
  })

  it('scopes the lookup query by learningPathId, userId, organizationId and courseIds when provided', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [{ data: [], error: null }],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    await revokeCourseAccessSourcedFromLearningPath({
      learningPathId: 'lp-1',
      userId: 'user-1',
      organizationId: 'org-1',
      courseIds: ['course-1', 'course-2'],
    })

    const chain = supabaseMock.chains.organization_course_assignments[0]
    expect(chain.eq).toHaveBeenCalledWith('source_learning_path_id', 'lp-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(chain.in).toHaveBeenCalledWith('course_id', ['course-1', 'course-2'])
  })
})

describe('forceRevokeCourseAccess', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
  })

  it('returns zero without touching the database when courseIds is empty', async () => {
    const result = await forceRevokeCourseAccess('user-1', 'org-1', [])

    expect(result).toEqual({ revokedCount: 0 })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('deletes matching rows regardless of progress and returns how many were removed', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [{ data: [{ id: 'a1' }, { id: 'a2' }], error: null }],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await forceRevokeCourseAccess('user-1', 'org-1', ['course-1', 'course-2'])

    expect(result).toEqual({ revokedCount: 2 })
    const chain = supabaseMock.chains.organization_course_assignments[0]
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(chain.in).toHaveBeenCalledWith('course_id', ['course-1', 'course-2'])
  })
})
