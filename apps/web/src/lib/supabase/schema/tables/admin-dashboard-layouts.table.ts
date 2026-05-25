import type { Json } from '../json'

export type AdminDashboardLayoutsTable = {
  Row: {
  created_at: string | null
  id: string
  is_default: boolean | null
  layout_config: Json
  name: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  id?: string
  is_default?: boolean | null
  layout_config?: Json
  name: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  id?: string
  is_default?: boolean | null
  layout_config?: Json
  name?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "admin_dashboard_layouts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "admin_dashboard_layouts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "admin_dashboard_layouts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "admin_dashboard_layouts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
