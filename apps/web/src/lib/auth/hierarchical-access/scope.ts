import type { HierarchyRole, HierarchyScope } from './types'

export function determineDefaultScope(role: HierarchyRole): HierarchyScope {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'organization'
    case 'regional_manager':
      return 'region'
    case 'zone_manager':
      return 'zone'
    case 'team_leader':
    case 'member':
    default:
      return 'team'
  }
}
