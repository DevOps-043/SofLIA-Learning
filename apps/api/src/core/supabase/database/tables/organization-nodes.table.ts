import type { Json } from '../json.types'

export type OrganizationNodesTable = {
  Row: {
    id: string
    organization_id: string
    name: string
    type: string | null
    properties: Json
  }
  Insert: {
    id?: string
    organization_id: string
    name: string
    type?: string | null
    properties?: Json
  }
  Update: {
    name?: string
    type?: string | null
    properties?: Json
  }
  Relationships: []
}
