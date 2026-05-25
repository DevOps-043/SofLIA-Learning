import { describe, expect, it } from 'vitest'

import {
  checkHierarchicalAccess,
  determineDefaultScope,
} from '../hierarchicalAuth'

describe('hierarchicalAuth access rules', () => {
  it('allows access when hierarchy is disabled for the organization', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: false,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'member',
        },
        { organizationId: 'org-1', teamId: 'team-2' },
      ),
    ).toEqual({ hasAccess: true })
  })

  it('rejects resources that belong to a different organization', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'organization',
          userRole: 'admin',
        },
        { organizationId: 'org-2' },
      ),
    ).toMatchObject({ code: 'WRONG_ORGANIZATION', hasAccess: false })
  })

  it('restricts region-scoped users to their assigned region', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          regionId: 'region-1',
          scope: 'region',
          userRole: 'regional_manager',
        },
        { organizationId: 'org-1', regionId: 'region-2' },
      ),
    ).toMatchObject({ code: 'OUTSIDE_REGION', hasAccess: false })
  })

  it('allows team-scoped users to reach explicitly accessible teams', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: ['team-2', 'team-3'],
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'team_leader',
        },
        { organizationId: 'org-1', teamId: 'team-3' },
      ),
    ).toEqual({ hasAccess: true })
  })

  it('maps roles to their default scopes', () => {
    expect(determineDefaultScope('owner')).toBe('organization')
    expect(determineDefaultScope('regional_manager')).toBe('region')
    expect(determineDefaultScope('zone_manager')).toBe('zone')
    expect(determineDefaultScope('member')).toBe('team')
  })
})
