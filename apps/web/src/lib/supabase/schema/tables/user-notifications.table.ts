import type { Json } from '../json'

export type UserNotificationsTable = {
  Row: {
  channels_pending: Json | null
  channels_sent: Json | null
  created_at: string | null
  expires_at: string | null
  group_id: string | null
  message: string
  metadata: Json | null
  notification_id: string
  notification_type: string
  organization_id: string | null
  priority: string | null
  read_at: string | null
  status: string | null
  title: string
  updated_at: string | null
  user_id: string
}
  Insert: {
  channels_pending?: Json | null
  channels_sent?: Json | null
  created_at?: string | null
  expires_at?: string | null
  group_id?: string | null
  message: string
  metadata?: Json | null
  notification_id?: string
  notification_type: string
  organization_id?: string | null
  priority?: string | null
  read_at?: string | null
  status?: string | null
  title: string
  updated_at?: string | null
  user_id: string
}
  Update: {
  channels_pending?: Json | null
  channels_sent?: Json | null
  created_at?: string | null
  expires_at?: string | null
  group_id?: string | null
  message?: string
  metadata?: Json | null
  notification_id?: string
  notification_type?: string
  organization_id?: string | null
  priority?: string | null
  read_at?: string | null
  status?: string | null
  title?: string
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_notifications_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_notifications_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_notifications_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
