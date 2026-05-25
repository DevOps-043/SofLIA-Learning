import { checkHierarchicalAccess } from './access';
import type { HierarchyContext, HierarchyRole, ResourceScope } from './types';

const MANAGEMENT_ROLES: HierarchyRole[] = [
  'owner',
  'admin',
  'regional_manager',
  'zone_manager',
  'team_leader',
];

export function canManageUser(
  managerContext: HierarchyContext | undefined,
  targetScope: ResourceScope,
): boolean {
  if (!managerContext) {
    return false;
  }

  if (managerContext.userRole === 'owner') {
    return true;
  }

  if (!managerContext.hierarchyEnabled) {
    return managerContext.userRole === 'admin';
  }

  const { hasAccess } = checkHierarchicalAccess(managerContext, targetScope);
  return hasAccess && MANAGEMENT_ROLES.includes(managerContext.userRole);
}
