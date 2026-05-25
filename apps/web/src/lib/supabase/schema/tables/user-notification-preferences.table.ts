import type { Json } from '../json'

export type UserNotificationPreferencesTable = {
  Row: {
  created_at: string | null
  do_not_disturb_days: Json | null
  do_not_disturb_end: string | null
  do_not_disturb_start: string | null
  email_enabled: boolean | null
  email_frequency: string | null
  in_app_enabled: boolean | null
  notification_type: string
  preference_id: string
  push_enabled: boolean | null
  timezone: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  do_not_disturb_days?: Json | null
  do_not_disturb_end?: string | null
  do_not_disturb_start?: string | null
  email_enabled?: boolean | null
  email_frequency?: string | null
  in_app_enabled?: boolean | null
  notification_type: string
  preference_id?: string
  push_enabled?: boolean | null
  timezone?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  do_not_disturb_days?: Json | null
  do_not_disturb_end?: string | null
  do_not_disturb_start?: string | null
  email_enabled?: boolean | null
  email_frequency?: string | null
  in_app_enabled?: boolean | null
  notification_type?: string
  preference_id?: string
  push_enabled?: boolean | null
  timezone?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
