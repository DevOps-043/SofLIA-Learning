import type {
  AccessCheckResult,
  HierarchyContext,
  ResourceScope,
} from './types';

export function checkHierarchicalAccess(
  userContext: HierarchyContext | undefined,
  resourceScope: ResourceScope,
): AccessCheckResult {
  if (!userContext) return { hasAccess: true };

  if (userContext.organizationId !== resourceScope.organizationId) {
    return deny('El recurso pertenece a otra organizacion', 'WRONG_ORGANIZATION');
  }

  if (!userContext.hierarchyEnabled || userContext.userRole === 'owner') {
    return { hasAccess: true };
  }

  switch (userContext.scope) {
    case 'organization':
      return { hasAccess: true };
    case 'region':
      return checkRegionAccess(userContext, resourceScope);
    case 'zone':
      return checkZoneAccess(userContext, resourceScope);
    case 'team':
      return checkTeamAccess(userContext, resourceScope);
    default:
      return deny('Scope de usuario desconocido', 'UNKNOWN_SCOPE');
  }
}

function checkRegionAccess(
  context: HierarchyContext,
  resourceScope: ResourceScope,
): AccessCheckResult {
  if (!resourceScope.regionId || resourceScope.regionId === context.regionId) {
    return { hasAccess: true };
  }

  return deny('El recurso esta fuera de tu region asignada', 'OUTSIDE_REGION');
}

function checkZoneAccess(
  context: HierarchyContext,
  resourceScope: ResourceScope,
): AccessCheckResult {
  if (!resourceScope.zoneId || resourceScope.zoneId === context.zoneId) {
    return { hasAccess: true };
  }

  return deny('El recurso esta fuera de tu zona asignada', 'OUTSIDE_ZONE');
}

function checkTeamAccess(
  context: HierarchyContext,
  resourceScope: ResourceScope,
): AccessCheckResult {
  if (!resourceScope.teamId || resourceScope.teamId === context.teamId) {
    return { hasAccess: true };
  }

  if (context.accessibleTeamIds?.includes(resourceScope.teamId)) {
    return { hasAccess: true };
  }

  return deny('El recurso esta fuera de tu equipo asignado', 'OUTSIDE_TEAM');
}

function deny(reason: string, code: string): AccessCheckResult {
  return { hasAccess: false, reason, code };
}
