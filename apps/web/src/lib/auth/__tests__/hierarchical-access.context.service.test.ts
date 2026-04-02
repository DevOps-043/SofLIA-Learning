import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

function createSingleResult<T>(data: T | null) {
  const result = { data, error: null }

  return {
    eq: vi.fn(function eq() {
      return this
    }),
    in: vi.fn(function queryIn() {
      return this
    }),
    neq: vi.fn(function queryNeq() {
      return this
    }),
    limit: vi.fn(function queryLimit() {
      return this
    }),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  }
}

function createListResult<T>(data: T[]) {
  const result = { data, error: null }

  return {
    eq: vi.fn(function eq() {
      return this
    }),
    in: vi.fn(function queryIn() {
      return this
    }),
    neq: vi.fn(function queryNeq() {
      return this
    }),
    limit: vi.fn(function queryLimit() {
      return this
    }),
    single: vi.fn().mockResolvedValue({ data: data[0] ?? null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: data[0] ?? null, error: null }),
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  }
}

function createSupabaseMock(
  relations: Record<string, ReturnType<typeof createSingleResult> | ReturnType<typeof createListResult>>,
) {
  return {
    from: vi.fn((relation: string) => ({
      select: vi.fn(() => relations[relation]),
    })),
  }
}

describe('hierarchical-access context service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns organization-wide access when hierarchy is disabled', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        organization_users: createSingleResult({
          id: 'membership-1',
          role: 'member',
          team_id: null,
          zone_id: null,
          region_id: null,
          hierarchy_scope: null,
          status: 'active',
        }),
        organizations: createSingleResult({
          id: 'org-1',
          name: 'Acme',
          hierarchy_enabled: false,
        }),
      }),
    )

    const { getHierarchyContext } = await import('../hierarchical-access/context.service')

    await expect(getHierarchyContext('user-1', 'org-1')).resolves.toEqual({
      organizationId: 'org-1',
      organizationName: 'Acme',
      hierarchyEnabled: false,
      userRole: 'member',
      scope: 'organization',
      regionId: null,
      zoneId: null,
      teamId: null,
      accessibleTeamIds: [],
      hasUnlimitedAccess: true,
    })
  })

  it('expands accessible teams for region-scoped users through loose Supabase queries', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        organization_users: createSingleResult({
          id: 'membership-2',
          role: 'regional_manager',
          team_id: null,
          zone_id: null,
          region_id: 'region-1',
          hierarchy_scope: 'region',
          status: 'active',
        }),
        organizations: createSingleResult({
          id: 'org-1',
          name: 'Acme',
          hierarchy_enabled: true,
        }),
        organization_regions: createSingleResult({
          id: 'region-1',
          name: 'North',
        }),
        organization_zones: createListResult([
          { id: 'zone-1' },
          { id: 'zone-2' },
        ]),
        organization_teams: createListResult([
          { id: 'team-1' },
          { id: 'team-2' },
        ]),
      }),
    )

    const { getHierarchyContext } = await import('../hierarchical-access/context.service')

    await expect(getHierarchyContext('user-2', 'org-1')).resolves.toMatchObject({
      organizationId: 'org-1',
      organizationName: 'Acme',
      hierarchyEnabled: true,
      userRole: 'regional_manager',
      scope: 'region',
      regionId: 'region-1',
      regionName: 'North',
      accessibleTeamIds: ['team-1', 'team-2'],
      hasUnlimitedAccess: false,
    })
  })
})
