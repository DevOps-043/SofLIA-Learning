export interface CreateNotificationParams {
  userId: string
  notificationType: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  priority?: 'critical' | 'high' | 'medium' | 'low'
  organizationId?: string
  groupId?: string
  isLocalized?: boolean
}

export interface Notification {
  notification_id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Record<string, unknown>
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'archived'
  channels_sent: string[]
  channels_pending: string[]
  read_at: string | null
  expires_at: string | null
  organization_id: string | null
  group_id: string | null
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  status?: 'unread' | 'read' | 'archived'
  notificationType?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  limit?: number
  offset?: number
  cursor?: string
  orderBy?: 'created_at' | 'priority' | 'status'
  orderDirection?: 'asc' | 'desc'
}

export interface NotificationCursor {
  createdAt: string
  notificationId: string
}

export interface NotificationQueryResult {
  notifications: Notification[]
  total: number
  hasMore: boolean
  nextCursor: string | null
}
