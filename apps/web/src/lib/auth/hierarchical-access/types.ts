export type HierarchyRole =
  | 'owner'
  | 'admin'
  | 'regional_manager'
  | 'zone_manager'
  | 'team_leader'
  | 'member'

export type HierarchyScope = 'organization' | 'region' | 'zone' | 'team'

export interface HierarchyContext {
  organizationId: string
  organizationName?: string
  hierarchyEnabled: boolean
  userRole: HierarchyRole
  scope: HierarchyScope
  regionId: string | null
  zoneId: string | null
  teamId: string | null
  regionName?: string
  zoneName?: string
  teamName?: string
  accessibleTeamIds: string[]
  hasUnlimitedAccess: boolean
}

export interface ResourceScope {
  organizationId: string
  regionId?: string | null
  zoneId?: string | null
  teamId?: string | null
}

export interface AccessResult {
  allowed: boolean
  reason?: string
  code?: string
}
