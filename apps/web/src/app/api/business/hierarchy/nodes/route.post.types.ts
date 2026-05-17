export interface StructureOrganizationRow {
  organization_id: string
}

export interface ParentNodeRow {
  path: string
  depth: number
}

export interface CreateNodeRequest {
  structure_id: string
  parent_id?: string | null
  name: string
  type: string
  position?: number | null
  manager_id?: string | null
  properties?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface OrganizationNodeInsert {
  structure_id: string
  parent_id: string | null
  name: string
  type: string
  position?: number | null
  manager_id?: string | null
  properties?: Record<string, unknown> | null
  organization_id: string
  path: string
  depth: number
}
