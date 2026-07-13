import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, assignCourseToUsersMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  assignCourseToUsersMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/features/courses/services/course-defaults/assignments', () => ({
  assignCourseToUsers: assignCourseToUsersMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import { assignCourseToUser } from '../admin-companies-assignments.service'

interface QueryResult {
  data: unknown
  error: unknown
}

function createChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'or', 'order', 'limit', 'insert', 'update', 'delete']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  return chain
}

describe('assignCourseToUser', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    assignCourseToUsersMock.mockReset()
  })

  it('delega en assignCourseToUsers (crea assignment + enrollment) y devuelve la fila', async () => {
    assignCourseToUsersMock.mockResolvedValue({
      targetUsers: 1,
      assigned: 1,
      existing: 0,
      createdAssignments: [{ id: 'assignment-1', user_id: 'user-1' }],
    })
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => createChain({ data: { id: 'assignment-1', status: 'assigned' }, error: null })),
    })

    const result = await assignCourseToUser('org-1', 'user-1', 'course-1', 'admin-1')

    expect(assignCourseToUsersMock).toHaveBeenCalledWith({
      organizationId: 'org-1',
      courseId: 'course-1',
      userIds: ['user-1'],
      assignedBy: 'admin-1',
      assignmentSource: 'manual',
    })
    expect(result).toEqual({ id: 'assignment-1', status: 'assigned' })
  })

  it('es idempotente: si ya existía asignación activa devuelve la fila existente sin fallar', async () => {
    assignCourseToUsersMock.mockResolvedValue({
      targetUsers: 1,
      assigned: 0,
      existing: 1,
      createdAssignments: [],
    })
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => createChain({ data: { id: 'assignment-existing' }, error: null })),
    })

    const result = await assignCourseToUser('org-1', 'user-1', 'course-1', 'admin-1')

    expect(result).toEqual({ id: 'assignment-existing' })
  })
})
