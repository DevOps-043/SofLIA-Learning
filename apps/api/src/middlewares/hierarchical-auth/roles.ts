import type { HierarchyRole, HierarchyScope } from './types';

export const ROLE_HIERARCHY: Record<HierarchyRole, number> = {
  owner: 100,
  admin: 80,
  regional_manager: 60,
  zone_manager: 40,
  team_leader: 20,
  member: 10,
};

export function determineDefaultScope(role: HierarchyRole): HierarchyScope {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'organization';
    case 'regional_manager':
      return 'region';
    case 'zone_manager':
      return 'zone';
    case 'team_leader':
    case 'member':
    default:
      return 'team';
  }
}

export function isRoleEqualOrHigher(
  userRole: HierarchyRole,
  requiredRole: HierarchyRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
