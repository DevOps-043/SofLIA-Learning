import type { Json } from '@/core/supabase/database.types'

import type {
  NotificationPriority,
  NotificationStatus,
} from './notifications.schemas'

export interface Notification {
  notification_id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Json
  priority: NotificationPriority
  status: NotificationStatus
  channels_sent: Json
  channels_pending: Json
  read_at: string | null
  expires_at: string | null
  organization_id: string | null
  group_id: string | null
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  status?: NotificationStatus
  notificationType?: string
  priority?: NotificationPriority
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'priority' | 'status'
  orderDirection?: 'asc' | 'desc'
}

export interface NormalizedNotificationFilters {
  status?: NotificationStatus
  notificationType?: string
  priority?: NotificationPriority
  limit: number
  offset: number
  orderBy: 'created_at' | 'priority' | 'status'
  orderDirection: 'asc' | 'desc'
}

export interface NotificationInsertPayload {
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Json
  priority: NotificationPriority
  status: 'unread'
  channels_sent: Json
  channels_pending: Json
  organization_id: string | null
  group_id: string | null
}

export interface NotificationPatch {
  status?: NotificationStatus
  read_at?: string | null
  updated_at?: string
}

export interface UnreadNotificationCounts {
  total: number
  critical: number
  high: number
}
