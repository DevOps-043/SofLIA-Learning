import type { ChatType, EntityType } from './types'

const LEVEL_ROLES: Record<ChatType, Partial<Record<EntityType, string>>> = {
  horizontal: {
    region: 'regional_manager',
    zone: 'zone_manager',
    team: 'team_leader',
  },
  vertical: {
    region: 'regional_manager',
    zone: 'zone_manager',
    team: 'team_leader',
    node: 'node_manager',
  },
}

export function resolveLevelRole(entityType: EntityType, chatType: ChatType) {
  return LEVEL_ROLES[chatType][entityType] || null
}
