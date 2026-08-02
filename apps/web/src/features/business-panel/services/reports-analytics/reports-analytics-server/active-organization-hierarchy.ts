import type { OrganizationRegionRecord } from './organization-region-record'
import type { OrganizationTeamRecord } from './organization-team-record'
import type { OrganizationUserRecord } from './organization-user-record'
import type { OrganizationZoneRecord } from './organization-zone-record'

export interface OrganizationStructureRecord {
  id: string
  name: string
  is_default: boolean | null
}

export interface OrganizationNodeRecord {
  id: string
  parent_id: string | null
  name: string
  type: string
  code: string | null
  depth: number | null
}

export interface OrganizationNodeMembershipRecord {
  node_id: string
  user_id: string
  is_primary: boolean | null
  created_at: string | null
}

export interface ActiveOrganizationHierarchy {
  structure: OrganizationStructureRecord
  nodes: OrganizationNodeRecord[]
  memberships: OrganizationNodeMembershipRecord[]
}

export interface AnalyticsHierarchyData {
  organizationUsers: OrganizationUserRecord[]
  regions: OrganizationRegionRecord[]
  zones: OrganizationZoneRecord[]
  teams: OrganizationTeamRecord[]
}
