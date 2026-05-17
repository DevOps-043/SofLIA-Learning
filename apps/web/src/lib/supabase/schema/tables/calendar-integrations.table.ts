import type { Json } from '../json'

export type CalendarIntegrationsTable = {
  Row: {
  access_token: string | null
  created_at: string
  expires_at: string | null
  id: string
  metadata: Json | null
  provider: string
  refresh_token: string | null
  scope: string | null
  updated_at: string
  user_id: string
}
  Insert: {
  access_token?: string | null
  created_at?: string
  expires_at?: string | null
  id?: string
  metadata?: Json | null
  provider: string
  refresh_token?: string | null
  scope?: string | null
  updated_at?: string
  user_id: string
}
  Update: {
  access_token?: string | null
  created_at?: string
  expires_at?: string | null
  id?: string
  metadata?: Json | null
  provider?: string
  refresh_token?: string | null
  scope?: string | null
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "calendar_integrations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_integrations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "calendar_integrations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_integrations_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
