import type { Json } from '../json'

export type NotificationChannelDeliveriesTable = {
  Row: {
    attempts: number
    channel: string
    created_at: string | null
    delivery_id: string
    destination: string | null
    last_error: string | null
    max_attempts: number
    next_attempt_at: string | null
    notification_id: string
    organization_id: string | null
    payload: Json
    provider_message_id: string | null
    sent_at: string | null
    status: string
    updated_at: string | null
    user_id: string
  }
  Insert: {
    attempts?: number
    channel: string
    created_at?: string | null
    delivery_id?: string
    destination?: string | null
    last_error?: string | null
    max_attempts?: number
    next_attempt_at?: string | null
    notification_id: string
    organization_id?: string | null
    payload?: Json
    provider_message_id?: string | null
    sent_at?: string | null
    status?: string
    updated_at?: string | null
    user_id: string
  }
  Update: {
    attempts?: number
    channel?: string
    created_at?: string | null
    delivery_id?: string
    destination?: string | null
    last_error?: string | null
    max_attempts?: number
    next_attempt_at?: string | null
    notification_id?: string
    organization_id?: string | null
    payload?: Json
    provider_message_id?: string | null
    sent_at?: string | null
    status?: string
    updated_at?: string | null
    user_id?: string
  }
  Relationships: [
    { foreignKeyName: "notification_channel_deliveries_notification_id_fkey"; columns: ["notification_id"]; isOneToOne: false; referencedRelation: "user_notifications"; referencedColumns: ["notification_id"] },
    { foreignKeyName: "notification_channel_deliveries_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "notification_channel_deliveries_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  ]
}
