import type { Json } from '../json.types'

export type UserNotificationsTable = {
  Row: {
    notification_id: string
    user_id: string
    notification_type: string
    title: string
    message: string
    metadata: Json
    priority: 'critical' | 'high' | 'medium' | 'low'
    status: 'unread' | 'read' | 'archived'
    channels_sent: Json
    channels_pending: Json
    read_at: string | null
    expires_at: string | null
    organization_id: string | null
    group_id: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    notification_id?: string
    user_id: string
    notification_type: string
    title: string
    message: string
    metadata?: Json
    priority?: 'critical' | 'high' | 'medium' | 'low'
    status?: 'unread' | 'read' | 'archived'
    channels_sent?: Json
    channels_pending?: Json
    read_at?: string | null
    expires_at?: string | null
    organization_id?: string | null
    group_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    status?: 'unread' | 'read' | 'archived'
    read_at?: string | null
    updated_at?: string
  }
  Relationships: []
}
