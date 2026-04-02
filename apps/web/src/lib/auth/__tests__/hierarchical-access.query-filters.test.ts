import { describe, expect, it, vi } from 'vitest'
import { applyHierarchyFilters, getAccessibleTeamIds } from '../hierarchical-access/query-filters'
import type { HierarchyContext } from '../hierarchical-access/types'

function createQueryMock() {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    or: vi.fn(() => query),
  }

  return query
}

describe('hierarchical-access query filters', () => {
  it('uses an OR filter for team-scoped users when null teams are allowed', () => {
    const query = createQueryMock()
    const context: HierarchyContext = {
      organizationId: 'org-1',
      hierarchyEnabled: true,
      userRole: 'team_leader',
      scope: 'team',
      regionId: null,
      zoneId: null,
      teamId: 'team-1',
      accessibleTeamIds: ['team-1', 'team-2'],
      hasUnlimitedAccess: false,
    }

    applyHierarchyFilters(query as never, context)

    expect(query.or).toHaveBeenCalledWith('team_id.in.(team-1,team-2),team_id.is.null')
  })

  it('returns null team restrictions for unlimited-access contexts', () => {
    expect(
      getAccessibleTeamIds({
        organizationId: 'org-1',
        hierarchyEnabled: true,
        userRole: 'owner',
        scope: 'organization',
        regionId: null,
        zoneId: null,
        teamId: null,
        accessibleTeamIds: [],
        hasUnlimitedAccess: true,
      }),
    ).toBeNull()
  })
})
