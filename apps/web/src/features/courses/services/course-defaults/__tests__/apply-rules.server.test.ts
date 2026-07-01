import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, listDefaultRulesMock, assignCourseToUsersMock, listHierarchyNodeOptionsMock, resolveTargetUserIdsMock } =
  vi.hoisted(() => ({
    createAdminClientMock: vi.fn(),
    listDefaultRulesMock: vi.fn(),
    assignCourseToUsersMock: vi.fn(),
    listHierarchyNodeOptionsMock: vi.fn(),
    resolveTargetUserIdsMock: vi.fn(),
  }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../rules', () => ({
  listDefaultRules: listDefaultRulesMock,
}))

vi.mock('../assignments', () => ({
  assignCourseToUsers: assignCourseToUsersMock,
}))

vi.mock('@/features/learning-paths/services/learning-path-defaults.server', () => ({
  LearningPathDefaultsService: {
    listHierarchyNodeOptions: listHierarchyNodeOptionsMock,
    resolveTargetUserIds: resolveTargetUserIdsMock,
  },
}))

import { applyDefaultRulesForUser } from '../apply-rules'
import type { CourseDefaultRule } from '../types'

interface QueryResult {
  data: unknown
  error: unknown
}

function createChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'in']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
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

function buildRule(overrides: Partial<CourseDefaultRule>): CourseDefaultRule {
  return {
    id: 'rule-1',
    organization_id: 'org-1',
    course_id: 'course-1',
    scope_type: 'organization',
    node_id: null,
    include_descendants: true,
    status: 'active',
    created_by: 'admin-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    course: { id: 'course-1', title: 'Course 1', is_active: true },
    node: null,
    ...overrides,
  }
}

describe('applyDefaultRulesForUser', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    listDefaultRulesMock.mockReset()
    assignCourseToUsersMock.mockReset()
    listHierarchyNodeOptionsMock.mockReset()
    resolveTargetUserIdsMock.mockReset()
  })

  it('returns an empty result when the user has no active membership in the organization', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({ organization_users: [{ data: null, error: null }] }))

    const result = await applyDefaultRulesForUser({ organizationId: 'org-1', userId: 'user-1' })

    expect(result).toEqual({ rulesApplied: 0, targetUsers: 0, assigned: 0, existing: 0 })
    expect(listDefaultRulesMock).not.toHaveBeenCalled()
  })

  it('applies an organization-scope rule to any active member', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_users: [{ data: { user_id: 'user-1', status: 'active' }, error: null }],
        organization_node_users: [{ data: [], error: null }],
      }),
    )
    listDefaultRulesMock.mockResolvedValue([buildRule({ scope_type: 'organization' })])
    listHierarchyNodeOptionsMock.mockResolvedValue([])
    assignCourseToUsersMock.mockResolvedValue({ targetUsers: 1, assigned: 1, existing: 0, createdAssignments: [] })

    const result = await applyDefaultRulesForUser({ organizationId: 'org-1', userId: 'user-1' })

    expect(assignCourseToUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1', userIds: ['user-1'], assignmentSource: 'default_rule' }),
    )
    expect(result).toEqual({ rulesApplied: 1, targetUsers: 1, assigned: 1, existing: 0 })
  })

  it('skips a node-scope rule when the user is not a member of that node or its descendants', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_users: [{ data: { user_id: 'user-1', status: 'active' }, error: null }],
        organization_node_users: [{ data: [{ node_id: 'other-node', user_id: 'user-1' }], error: null }],
      }),
    )
    listDefaultRulesMock.mockResolvedValue([
      buildRule({
        scope_type: 'node',
        node_id: 'target-node',
        include_descendants: true,
        node: { id: 'target-node', name: 'Target', type: 'team', path: 'root.target' },
      }),
    ])
    listHierarchyNodeOptionsMock.mockResolvedValue([
      { id: 'other-node', name: 'Other', type: 'team', path: 'root.other', parent_id: null, depth: 1 },
    ])

    const result = await applyDefaultRulesForUser({ organizationId: 'org-1', userId: 'user-1' })

    expect(assignCourseToUsersMock).not.toHaveBeenCalled()
    expect(result).toEqual({ rulesApplied: 0, targetUsers: 0, assigned: 0, existing: 0 })
  })

  it('applies a node-scope rule when the user belongs to a descendant node and include_descendants is true', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_users: [{ data: { user_id: 'user-1', status: 'active' }, error: null }],
        organization_node_users: [{ data: [{ node_id: 'child-node', user_id: 'user-1' }], error: null }],
      }),
    )
    listDefaultRulesMock.mockResolvedValue([
      buildRule({
        scope_type: 'node',
        node_id: 'target-node',
        include_descendants: true,
        node: { id: 'target-node', name: 'Target', type: 'team', path: 'root.target' },
      }),
    ])
    listHierarchyNodeOptionsMock.mockResolvedValue([
      { id: 'child-node', name: 'Child', type: 'team', path: 'root.target.child', parent_id: 'target-node', depth: 2 },
    ])
    assignCourseToUsersMock.mockResolvedValue({ targetUsers: 1, assigned: 1, existing: 0, createdAssignments: [] })

    const result = await applyDefaultRulesForUser({ organizationId: 'org-1', userId: 'user-1' })

    expect(assignCourseToUsersMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ rulesApplied: 1, targetUsers: 1, assigned: 1, existing: 0 })
  })

  it('ignores revoked rules and rules for inactive courses', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organization_users: [{ data: { user_id: 'user-1', status: 'active' }, error: null }],
      }),
    )
    listDefaultRulesMock.mockResolvedValue([
      buildRule({ id: 'revoked-rule', status: 'revoked' }),
      buildRule({ id: 'inactive-course-rule', course: { id: 'course-2', title: 'Inactive', is_active: false } }),
    ])

    const result = await applyDefaultRulesForUser({ organizationId: 'org-1', userId: 'user-1' })

    expect(assignCourseToUsersMock).not.toHaveBeenCalled()
    expect(result).toEqual({ rulesApplied: 0, targetUsers: 0, assigned: 0, existing: 0 })
  })
})
