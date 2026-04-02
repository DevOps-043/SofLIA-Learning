import { describe, expect, it } from 'vitest';

import {
  canAssignUsers,
  canManageHierarchy,
  canManageUser,
  checkAccess,
  isRoleEqualOrHigher,
} from '../hierarchical-access/permissions';
import { ROLE_LABELS } from '../hierarchical-access/constants';
import { getAccessibleTeamIds } from '../hierarchical-access/query-filters';
import { determineDefaultScope } from '../hierarchical-access/scope';
import type { HierarchyContext } from '../hierarchical-access/types';

function createContext(
  overrides: Partial<HierarchyContext> = {}
): HierarchyContext {
  return {
    organizationId: 'org-1',
    hierarchyEnabled: true,
    userRole: 'team_leader',
    scope: 'team',
    regionId: 'region-1',
    zoneId: 'zone-1',
    teamId: 'team-1',
    accessibleTeamIds: ['team-1', 'team-2'],
    hasUnlimitedAccess: false,
    ...overrides,
  };
}

describe('hierarchicalAccess rules', () => {
  it('maps roles to their default scopes', () => {
    expect(determineDefaultScope('admin')).toBe('organization');
    expect(determineDefaultScope('regional_manager')).toBe('region');
    expect(determineDefaultScope('member')).toBe('team');
  });

  it('rejects resources from another organization', () => {
    const result = checkAccess(createContext(), {
      organizationId: 'org-2',
    });

    expect(result).toEqual({
      allowed: false,
      reason: 'El recurso pertenece a otra organización',
      code: 'WRONG_ORGANIZATION',
    });
  });

  it('allows access to explicitly accessible teams', () => {
    const result = checkAccess(createContext(), {
      organizationId: 'org-1',
      teamId: 'team-2',
    });

    expect(result).toEqual({ allowed: true });
  });

  it('restricts management when the target is outside the manager scope', () => {
    const manager = createContext({
      userRole: 'zone_manager',
      scope: 'zone',
      accessibleTeamIds: [],
    });

    expect(
      canManageUser(manager, {
        organizationId: 'org-1',
        zoneId: 'zone-2',
      })
    ).toBe(false);
  });

  it('allows owners to manage without scope checks', () => {
    expect(
      canManageUser(
        createContext({
          userRole: 'owner',
          hasUnlimitedAccess: true,
        }),
        {
          organizationId: 'org-1',
          teamId: 'team-99',
        }
      )
    ).toBe(true);
  });

  it('returns the most specific team restriction for queries', () => {
    expect(getAccessibleTeamIds(createContext())).toEqual(['team-1', 'team-2']);
    expect(
      getAccessibleTeamIds(
        createContext({
          accessibleTeamIds: [],
        })
      )
    ).toEqual(['team-1']);
    expect(
      getAccessibleTeamIds(
        createContext({
          hierarchyEnabled: false,
        })
      )
    ).toBeNull();
  });

  it('keeps role helper semantics aligned with hierarchy labels', () => {
    expect(isRoleEqualOrHigher('admin', 'team_leader')).toBe(true);
    expect(isRoleEqualOrHigher('member', 'admin')).toBe(false);
    expect(canAssignUsers(createContext())).toBe(true);
    expect(canManageHierarchy(createContext())).toBe(false);
    expect(ROLE_LABELS.owner).toBe('Propietario');
  });
});
