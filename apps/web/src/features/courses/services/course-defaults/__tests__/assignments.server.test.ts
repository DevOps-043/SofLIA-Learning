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

import { assignCourseToUsers } from '../assignments'

interface QueryResult {
  data: unknown
  error: unknown
}

function createChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'in', 'or', 'order', 'is', 'insert', 'update']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

function createSupabaseMock(resultsByTable: Record<string, QueryResult[]>) {
  return {
    from: vi.fn((table: string) => {
      const queue = resultsByTable[table]
      const result = queue?.shift() ?? { data: [], error: null }
      return createChain(result)
    }),
  }
}

describe('assignCourseToUsers', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
  })

  it('returns a zero-effect result and skips the database when userIds is empty', async () => {
    const result = await assignCourseToUsers({
      organizationId: 'org-1',
      courseId: 'course-1',
      userIds: [],
      assignedBy: 'admin-1',
      assignmentSource: 'bulk',
    })

    expect(result).toEqual({ targetUsers: 0, assigned: 0, existing: 0, createdAssignments: [] })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('only inserts assignments and enrollments for users without an active assignment', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_course_assignments: [
          { data: [{ user_id: 'user-existing' }], error: null },
          { data: [{ id: 'assignment-new', user_id: 'user-new' }], error: null },
        ],
        user_course_enrollments: [
          { data: [], error: null },
          { data: null, error: null },
        ],
      }),
    )

    const result = await assignCourseToUsers({
      organizationId: 'org-1',
      courseId: 'course-1',
      userIds: ['user-existing', 'user-new'],
      assignedBy: 'admin-1',
      assignmentSource: 'default_rule',
      defaultRuleId: 'rule-1',
    })

    expect(result).toEqual({
      targetUsers: 2,
      assigned: 1,
      existing: 1,
      createdAssignments: [{ id: 'assignment-new', user_id: 'user-new' }],
    })
  })

  it('deduplicates repeated user ids before counting target users', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_course_assignments: [
          { data: [], error: null },
          { data: [{ id: 'assignment-1', user_id: 'user-1' }], error: null },
        ],
        user_course_enrollments: [
          { data: [], error: null },
          { data: null, error: null },
        ],
      }),
    )

    const result = await assignCourseToUsers({
      organizationId: 'org-1',
      courseId: 'course-1',
      userIds: ['user-1', 'user-1'],
      assignedBy: 'admin-1',
      assignmentSource: 'manual',
    })

    expect(result.targetUsers).toBe(1)
    expect(result.assigned).toBe(1)
  })

  it('is idempotent: makes no writes when every requested user is already assigned', async () => {
    const supabaseMock = createSupabaseMock({
      organization_course_assignments: [{ data: [{ user_id: 'user-1' }], error: null }],
    })
    createAdminClientMock.mockReturnValue(supabaseMock)

    const result = await assignCourseToUsers({
      organizationId: 'org-1',
      courseId: 'course-1',
      userIds: ['user-1'],
      assignedBy: null,
      assignmentSource: 'manual',
    })

    expect(result).toEqual({ targetUsers: 1, assigned: 0, existing: 1, createdAssignments: [] })
    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
    expect(supabaseMock.from).not.toHaveBeenCalledWith('user_course_enrollments')
  })
})
