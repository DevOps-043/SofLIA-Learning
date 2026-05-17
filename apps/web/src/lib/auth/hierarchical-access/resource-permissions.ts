import type { AccessResult, HierarchyContext, ResourceScope } from './types'

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
      reason: 'El recurso pertenece a otra organizaciÃ³n',
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
        reason: 'Recurso fuera de tu regiÃ³n',
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
