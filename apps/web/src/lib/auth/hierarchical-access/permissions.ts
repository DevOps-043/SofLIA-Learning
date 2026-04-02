import { ROLE_HIERARCHY } from './constants'
import type { AccessResult, HierarchyContext, HierarchyRole, ResourceScope } from './types'

export function checkAccess(
  context: HierarchyContext | null,
  resource: ResourceScope,
): AccessResult {
  if (!context) {
    return { allowed: true }
  }

  if (context.organizationId !== resource.organizationId) {
    return {
      allowed: false,
      reason: 'El recurso pertenece a otra organización',
      code: 'WRONG_ORGANIZATION',
    }
  }

  if (!context.hierarchyEnabled || context.hasUnlimitedAccess) {
    return { allowed: true }
  }

  switch (context.scope) {
    case 'organization':
      return { allowed: true }
    case 'region':
      if (!resource.regionId || resource.regionId === context.regionId) {
        return { allowed: true }
      }
      return {
        allowed: false,
        reason: 'Recurso fuera de tu región',
        code: 'OUTSIDE_REGION',
      }
    case 'zone':
      if (!resource.zoneId || resource.zoneId === context.zoneId) {
        return { allowed: true }
      }
      return {
        allowed: false,
        reason: 'Recurso fuera de tu zona',
        code: 'OUTSIDE_ZONE',
      }
    case 'team':
      if (!resource.teamId || resource.teamId === context.teamId) {
        return { allowed: true }
      }
      if (context.accessibleTeamIds.includes(resource.teamId)) {
        return { allowed: true }
      }
      return {
        allowed: false,
        reason: 'Recurso fuera de tu equipo',
        code: 'OUTSIDE_TEAM',
      }
    default:
      return { allowed: true }
  }
}

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

  return ['owner', 'admin', 'regional_manager', 'zone_manager', 'team_leader'].includes(
    managerContext.userRole,
  )
}

export function isRoleEqualOrHigher(userRole: HierarchyRole, requiredRole: HierarchyRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAssignUsers(context: HierarchyContext | null): boolean {
  if (!context) {
    return false
  }

  return ['owner', 'admin', 'regional_manager', 'zone_manager', 'team_leader'].includes(
    context.userRole,
  )
}

export function canManageHierarchy(context: HierarchyContext | null): boolean {
  return context?.userRole === 'owner'
}

export function canToggleHierarchy(context: HierarchyContext | null): boolean {
  return context?.userRole === 'owner'
}
