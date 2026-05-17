export type UserUnreadNotificationsView = {
  Row: {
  created_at: string | null
  expires_at: string | null
  message: string | null
  notification_id: string | null
  notification_type: string | null
  priority: string | null
  title: string | null
  user_id: string | null
}
  Insert: {
  created_at?: string | null
  expires_at?: string | null
  message?: string | null
  notification_id?: string | null
  notification_type?: string | null
  priority?: string | null
  title?: string | null
  user_id?: string | null
}
  Update: {
  created_at?: string | null
  expires_at?: string | null
  message?: string | null
  notification_id?: string | null
  notification_type?: string | null
  priority?: string | null
  title?: string | null
  user_id?: string | null
}
  Relationships: [
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
