export type NotificationEmailQueueTable = {
  Row: {
  attempts: number | null
  created_at: string | null
  email_type: string
  error_message: string | null
  notification_id: string | null
  priority: string | null
  queue_id: string
  scheduled_at: string | null
  sent_at: string | null
  status: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  attempts?: number | null
  created_at?: string | null
  email_type?: string
  error_message?: string | null
  notification_id?: string | null
  priority?: string | null
  queue_id?: string
  scheduled_at?: string | null
  sent_at?: string | null
  status?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  attempts?: number | null
  created_at?: string | null
  email_type?: string
  error_message?: string | null
  notification_id?: string | null
  priority?: string | null
  queue_id?: string
  scheduled_at?: string | null
  sent_at?: string | null
  status?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "notification_email_queue_notification_id_fkey"; columns: ["notification_id"]; isOneToOne: false; referencedRelation: "user_notifications"; referencedColumns: ["notification_id"] },
    { foreignKeyName: "notification_email_queue_notification_id_fkey"; columns: ["notification_id"]; isOneToOne: false; referencedRelation: "user_unread_notifications"; referencedColumns: ["notification_id"] },
    { foreignKeyName: "notification_email_queue_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_email_queue_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_email_queue_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_email_queue_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
