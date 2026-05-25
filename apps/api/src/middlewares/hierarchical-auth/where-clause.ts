import type { HierarchyContext, HierarchyWhereClause } from './types';

export function buildHierarchyWhereClause(
  context: HierarchyContext | undefined,
  columnPrefix = '',
): HierarchyWhereClause {
  if (!context || !context.hierarchyEnabled || context.userRole === 'owner') {
    return unrestrictedClause();
  }

  if (context.scope === 'organization') {
    return unrestrictedClause();
  }

  if (context.scope === 'region' && context.regionId) {
    return {
      clause: `(${columnPrefix}region_id = :regionId OR ${columnPrefix}region_id IS NULL)`,
      params: { regionId: context.regionId },
    };
  }

  if (context.scope === 'zone' && context.zoneId) {
    return {
      clause: `(${columnPrefix}zone_id = :zoneId OR ${columnPrefix}zone_id IS NULL)`,
      params: { zoneId: context.zoneId },
    };
  }

  if (context.scope === 'team') {
    return buildTeamWhereClause(context, columnPrefix);
  }

  return unrestrictedClause();
}

function buildTeamWhereClause(
  context: HierarchyContext,
  columnPrefix: string,
): HierarchyWhereClause {
  if (context.accessibleTeamIds && context.accessibleTeamIds.length > 0) {
    return {
      clause: `(${columnPrefix}team_id = ANY(:teamIds) OR ${columnPrefix}team_id IS NULL)`,
      params: { teamIds: context.accessibleTeamIds },
    };
  }

  if (context.teamId) {
    return {
      clause: `(${columnPrefix}team_id = :teamId OR ${columnPrefix}team_id IS NULL)`,
      params: { teamId: context.teamId },
    };
  }

  return { clause: `${columnPrefix}team_id IS NULL`, params: {} };
}

function unrestrictedClause(): HierarchyWhereClause {
  return { clause: 'TRUE', params: {} };
}
