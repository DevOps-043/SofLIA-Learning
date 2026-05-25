import type { Json } from '../json'

export type AdminDashboardPreferencesTable = {
  Row: {
  activity_period: string | null
  created_at: string | null
  growth_chart_metrics: Json | null
  id: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  activity_period?: string | null
  created_at?: string | null
  growth_chart_metrics?: Json | null
  id?: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  activity_period?: string | null
  created_at?: string | null
  growth_chart_metrics?: Json | null
  id?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "admin_dashboard_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "admin_dashboard_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "admin_dashboard_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "admin_dashboard_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
