import type { Json } from '../json'

export type DashboardLayoutsTable = {
  Row: {
  created_at: string | null
  id: string
  is_default: boolean | null
  layout_config: Json
  name: string
  organization_id: string
  updated_at: string | null
}
  Insert: {
  created_at?: string | null
  id?: string
  is_default?: boolean | null
  layout_config?: Json
  name: string
  organization_id: string
  updated_at?: string | null
}
  Update: {
  created_at?: string | null
  id?: string
  is_default?: boolean | null
  layout_config?: Json
  name?: string
  organization_id?: string
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "dashboard_layouts_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "dashboard_layouts_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "dashboard_layouts_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
