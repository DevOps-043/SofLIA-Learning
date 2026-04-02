import type { HierarchyContext } from './types'

interface HierarchyFilterQuery<TQuery> {
  eq(column: string, value: string): TQuery
  in(column: string, values: readonly string[]): TQuery
  or(filters: string): TQuery
}

export interface ApplyHierarchyFilterOptions {
  teamIdColumn?: string
  zoneIdColumn?: string
  regionIdColumn?: string
  allowNullTeam?: boolean
}

export function applyHierarchyFilters<TQuery extends HierarchyFilterQuery<TQuery>>(
  query: TQuery,
  context: HierarchyContext | null,
  options: ApplyHierarchyFilterOptions = {},
): TQuery {
  const {
    teamIdColumn = 'team_id',
    zoneIdColumn = 'zone_id',
    regionIdColumn = 'region_id',
    allowNullTeam = true,
  } = options

  if (!context || !context.hierarchyEnabled || context.hasUnlimitedAccess) {
    return query
  }

  switch (context.scope) {
    case 'organization':
      return query
    case 'region':
      if (context.regionId) {
        if (allowNullTeam) {
          return query.or(
            `${regionIdColumn}.eq.${context.regionId},${regionIdColumn}.is.null`,
          )
        }

        return query.eq(regionIdColumn, context.regionId)
      }
      break
    case 'zone':
      if (context.zoneId) {
        if (allowNullTeam) {
          return query.or(`${zoneIdColumn}.eq.${context.zoneId},${zoneIdColumn}.is.null`)
        }

        return query.eq(zoneIdColumn, context.zoneId)
      }
      break
    case 'team':
      if (context.accessibleTeamIds.length > 0) {
        if (allowNullTeam) {
          return query.or(
            `${teamIdColumn}.in.(${context.accessibleTeamIds.join(',')}),${teamIdColumn}.is.null`,
          )
        }

        return query.in(teamIdColumn, context.accessibleTeamIds)
      }

      if (context.teamId) {
        if (allowNullTeam) {
          return query.or(`${teamIdColumn}.eq.${context.teamId},${teamIdColumn}.is.null`)
        }

        return query.eq(teamIdColumn, context.teamId)
      }
      break
  }

  return query
}

export function getAccessibleTeamIds(context: HierarchyContext | null): string[] | null {
  if (!context || !context.hierarchyEnabled || context.hasUnlimitedAccess) {
    return null
  }

  if (context.accessibleTeamIds.length > 0) {
    return context.accessibleTeamIds
  }

  if (context.teamId) {
    return [context.teamId]
  }

  return []
}
