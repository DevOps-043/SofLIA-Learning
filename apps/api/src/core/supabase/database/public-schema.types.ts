import type { DatabaseFunctions } from './database.functions'
import type { DatabaseTables } from './database.tables'

export type PublicSchema = {
  Tables: DatabaseTables
  Views: Record<string, never>
  Functions: DatabaseFunctions
  Enums: Record<string, never>
  CompositeTypes: Record<string, never>
}
