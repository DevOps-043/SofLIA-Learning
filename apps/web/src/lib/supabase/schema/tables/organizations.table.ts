import type { OrganizationsRow } from './organizations.row'
import type { OrganizationsInsert } from './organizations.insert'
import type { OrganizationsUpdate } from './organizations.update'
import type { OrganizationsRelationships } from './organizations.relationships'

export type OrganizationsTable = {
  Row: OrganizationsRow
  Insert: OrganizationsInsert
  Update: OrganizationsUpdate
  Relationships: OrganizationsRelationships
}
