import type { HierarchyContext } from './types';

export function getAccessibleTeamIds(
  context: HierarchyContext | undefined,
): string[] | null {
  if (!context || !context.hierarchyEnabled) {
    return null;
  }

  if (context.userRole === 'owner' || context.scope === 'organization') {
    return null;
  }

  if (context.accessibleTeamIds !== null) {
    return context.accessibleTeamIds;
  }

  if (context.teamId) {
    return [context.teamId];
  }

  return [];
}
