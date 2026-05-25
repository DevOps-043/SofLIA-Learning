import type { Json } from '../json'

export type NotificationPushSubscriptionsTable = {
  Row: {
  created_at: string | null
  endpoint: string
  keys: Json
  last_used_at: string | null
  status: string | null
  subscription_id: string
  updated_at: string | null
  user_agent: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  endpoint: string
  keys: Json
  last_used_at?: string | null
  status?: string | null
  subscription_id?: string
  updated_at?: string | null
  user_agent?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  endpoint?: string
  keys?: Json
  last_used_at?: string | null
  status?: string | null
  subscription_id?: string
  updated_at?: string | null
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "notification_push_subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_push_subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_push_subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "notification_push_subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
