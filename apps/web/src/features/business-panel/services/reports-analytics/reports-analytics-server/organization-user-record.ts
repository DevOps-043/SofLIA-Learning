import type { Relation } from './relation'
import type { UserProfileRecord } from './user-profile-record'

export interface OrganizationUserRecord {
  user_id: string
  role: string | null
  job_title: string | null
  status: string | null
  joined_at: string | null
  created_at: string | null
  region_id?: string | null
  zone_id?: string | null
  team_id?: string | null
  hierarchy_scope?: string | null
  users: Relation<UserProfileRecord>
}
