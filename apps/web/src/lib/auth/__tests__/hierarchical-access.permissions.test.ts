import { describe, expect, it } from 'vitest'
import { canManageUser, checkAccess, isRoleEqualOrHigher } from '../hierarchical-access/permissions'
import { determineDefaultScope } from '../hierarchical-access/scope'
import type { HierarchyContext } from '../hierarchical-access/types'

const teamContext: HierarchyContext = {
  organizationId: 'org-1',
  hierarchyEnabled: true,
  userRole: 'team_leader',
  scope: 'team',
  regionId: 'region-1',
  zoneId: 'zone-1',
  teamId: 'team-1',
  accessibleTeamIds: ['team-1', 'team-2'],
  hasUnlimitedAccess: false,
}

describe('hierarchical-access permissions', () => {
  it('computes the default scope from the hierarchy role', () => {
    expect(determineDefaultScope('owner')).toBe('organization')
    expect(determineDefaultScope('regional_manager')).toBe('region')
    expect(determineDefaultScope('member')).toBe('team')
  })

  it('allows access when a resource belongs to one of the accessible teams', () => {
    expect(
      checkAccess(teamContext, {
        organizationId: 'org-1',
        teamId: 'team-2',
      }),
    ).toEqual({ allowed: true })
  })

  it('blocks access when a resource belongs to a different organization', () => {
    expect(
      checkAccess(teamContext, {
        organizationId: 'org-2',
        teamId: 'team-1',
      }),
    ).toEqual({
      allowed: false,
      reason: 'El recurso pertenece a otra organización',
      code: 'WRONG_ORGANIZATION',
    })
  })

  it('requires both scope access and a management role to manage another user', () => {
    expect(
      canManageUser(teamContext, {
        organizationId: 'org-1',
        teamId: 'team-2',
      }),
    ).toBe(true)
    expect(
      canManageUser(teamContext, {
        organizationId: 'org-1',
        teamId: 'team-3',
      }),
    ).toBe(false)
  })

  it('compares role hierarchy consistently', () => {
    expect(isRoleEqualOrHigher('admin', 'zone_manager')).toBe(true)
    expect(isRoleEqualOrHigher('member', 'team_leader')).toBe(false)
  })
})
