import type { Json } from '../json'

export type NotificationSettingsTable = {
  Row: {
  channels: Json | null
  created_at: string | null
  enabled: boolean | null
  event_type: string
  id: string
  organization_id: string
  template: string | null
  updated_at: string | null
}
  Insert: {
  channels?: Json | null
  created_at?: string | null
  enabled?: boolean | null
  event_type: string
  id?: string
  organization_id: string
  template?: string | null
  updated_at?: string | null
}
  Update: {
  channels?: Json | null
  created_at?: string | null
  enabled?: boolean | null
  event_type?: string
  id?: string
  organization_id?: string
  template?: string | null
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "notification_settings_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_settings_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "notification_settings_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
