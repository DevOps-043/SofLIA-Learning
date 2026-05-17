import { ROLE_HIERARCHY } from './constants'
import { checkAccess } from './resource-permissions'
import type { HierarchyContext, HierarchyRole, ResourceScope } from './types'

const USER_ASSIGNMENT_ROLES: HierarchyRole[] = [
  'owner',
  'admin',
  'regional_manager',
  'zone_manager',
  'team_leader',
]

export function canManageUser(
  managerContext: HierarchyContext | null,
  targetUserScope: ResourceScope,
): boolean {
  if (!managerContext) {
    return false
  }

  if (managerContext.userRole === 'owner') {
    return true
  }

  if (!managerContext.hierarchyEnabled) {
    return managerContext.userRole === 'admin'
  }

  if (!checkAccess(managerContext, targetUserScope).allowed) {
    return false
  }

  return USER_ASSIGNMENT_ROLES.includes(managerContext.userRole)
}

export function isRoleEqualOrHigher(userRole: HierarchyRole, requiredRole: HierarchyRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAssignUsers(context: HierarchyContext | null): boolean {
  if (!context) {
    return false
  }

  return USER_ASSIGNMENT_ROLES.includes(context.userRole)
}

export function canManageHierarchy(context: HierarchyContext | null): boolean {
  return context?.userRole === 'owner'
}

export function canToggleHierarchy(context: HierarchyContext | null): boolean {
  return context?.userRole === 'owner'
}
