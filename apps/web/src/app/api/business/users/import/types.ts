import type { UserGender } from '@/lib/schemas/user-demographics.schema'

export interface ImportResult {
  success: number
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>
  total: number
}

export type ParsedImportUserRow = Record<string, string>

export interface UserInsertData {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string
  type_rol: string
  organization_id: string
  date_of_birth: string | null
  gender: UserGender | null
}

export interface HierarchyAutoAssignConfig {
  enabled: boolean
  defaultTeamId: string | null
}

export interface ImportContext {
  organizationId: string
  createdBy: string
  hierarchy: HierarchyAutoAssignConfig
}
