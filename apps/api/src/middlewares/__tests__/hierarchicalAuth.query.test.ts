import { describe, expect, it } from 'vitest'

import {
  buildHierarchyWhereClause,
  canManageUser,
  getAccessibleTeamIds,
  isRoleEqualOrHigher,
} from '../hierarchicalAuth'

describe('hierarchicalAuth query helpers', () => {
  it('builds a SQL filter for team-scoped users with accessible teams', () => {
    expect(
      buildHierarchyWhereClause(
        {
          accessibleTeamIds: ['team-1', 'team-2'],
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'team_leader',
        },
        'u.',
      ),
    ).toEqual({
      clause: '(u.team_id = ANY(:teamIds) OR u.team_id IS NULL)',
      params: { teamIds: ['team-1', 'team-2'] },
    })
  })

  it('computes accessible team ids and management permissions', () => {
    expect(
      getAccessibleTeamIds({
        accessibleTeamIds: null,
        hierarchyEnabled: true,
        organizationId: 'org-1',
        scope: 'team',
        teamId: 'team-9',
        userRole: 'team_leader',
      }),
    ).toEqual(['team-9'])

    expect(
      canManageUser(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'member',
        },
        { organizationId: 'org-1', teamId: 'team-1' },
      ),
    ).toBe(false)

    expect(
      canManageUser(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: false,
          organizationId: 'org-1',
          scope: 'organization',
          userRole: 'admin',
        },
        { organizationId: 'org-1' },
      ),
    ).toBe(true)
  })

  it('compares role precedence correctly', () => {
    expect(isRoleEqualOrHigher('admin', 'zone_manager')).toBe(true)
    expect(isRoleEqualOrHigher('member', 'team_leader')).toBe(false)
  })
})
