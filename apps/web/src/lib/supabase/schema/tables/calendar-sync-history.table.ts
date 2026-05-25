import type { Json } from '../json'

export type CalendarSyncHistoryTable = {
  Row: {
  changes_detected: Json | null
  created_at: string | null
  events_snapshot: Json
  id: string
  lia_notification_sent: boolean | null
  notification_message: string | null
  plan_id: string | null
  synced_at: string | null
  user_id: string
}
  Insert: {
  changes_detected?: Json | null
  created_at?: string | null
  events_snapshot: Json
  id?: string
  lia_notification_sent?: boolean | null
  notification_message?: string | null
  plan_id?: string | null
  synced_at?: string | null
  user_id: string
}
  Update: {
  changes_detected?: Json | null
  created_at?: string | null
  events_snapshot?: Json
  id?: string
  lia_notification_sent?: boolean | null
  notification_message?: string | null
  plan_id?: string | null
  synced_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "calendar_sync_history_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "study_plan_progress"; referencedColumns: ["plan_id"] },
    { foreignKeyName: "calendar_sync_history_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "study_plans"; referencedColumns: ["id"] },
    { foreignKeyName: "calendar_sync_history_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "v_ai_generated_plans"; referencedColumns: ["plan_id"] },
    { foreignKeyName: "calendar_sync_history_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_sync_history_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "calendar_sync_history_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "calendar_sync_history_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
