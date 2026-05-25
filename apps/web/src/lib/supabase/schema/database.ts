import type { PublicCompositeTypes } from './composite-types'
import type { PublicEnums } from './enums'
import type { PublicFunctions } from './functions'
import type { PublicTables } from './tables'
import type { PublicViews } from './views'

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: PublicTables
    Views: PublicViews
    Functions: PublicFunctions
    Enums: PublicEnums
    CompositeTypes: PublicCompositeTypes
  }
}
