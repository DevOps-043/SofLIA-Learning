import type { UsersRow } from './users.row'
import type { UsersInsert } from './users.insert'
import type { UsersUpdate } from './users.update'
import type { UsersRelationships } from './users.relationships'

export type UsersTable = {
  Row: UsersRow
  Insert: UsersInsert
  Update: UsersUpdate
  Relationships: UsersRelationships
}
