import type { Json } from '../../../../lib/supabase/types'
import type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
} from './types'

export const NON_DUPLICATE_NOTIFICATION_TYPES: Record<string, number> = {
  system_login_success: 5,
  system_login_failed: 1,
  system_password_changed: 1,
  system_email_verified: 1,
}

export function getDuplicateNotificationWindow(notificationType: string) {
  return NON_DUPLICATE_NOTIFICATION_TYPES[notificationType]
}

export function buildNotificationInsertPayload(
  params: CreateNotificationParams,
): {
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Json
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'unread'
  channels_sent: Json
  channels_pending: Json
  organization_id: string | null
  group_id: string | null
} {
  return {
    user_id: params.userId,
    notification_type: params.notificationType,
    title: params.title.trim(),
    message: params.message.trim(),
    metadata: (params.metadata || {}) as Json,
    priority: params.priority || 'medium',
    status: 'unread' as const,
    channels_sent: [] as Json,
    channels_pending: [] as Json,
    organization_id: params.organizationId || null,
    group_id: params.groupId || null,
  }
}

export function normalizeNotificationFilters(filters?: NotificationFilters) {
  return {
    status: filters?.status,
    notificationType: filters?.notificationType,
    priority: filters?.priority,
    limit:
      filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50,
    offset: filters?.offset && filters.offset >= 0 ? filters.offset : 0,
    orderBy: filters?.orderBy || 'created_at',
    orderDirection: filters?.orderDirection || 'desc',
  }
}

export function filterExpiredNotifications<T extends { expires_at?: string | null }>(
  notifications: T[],
  now = new Date(),
) {
  return notifications.filter((notification) => {
    if (!notification.expires_at) {
      return true
    }

    return new Date(notification.expires_at) > now
  })
}

export function attachUsersToNotifications<
  T extends { user_id: string; users?: unknown },
  U extends { id: string },
>(notifications: T[], users: U[]) {
  const usersMap = new Map(users.map((user) => [user.id, user]))

  return notifications.map((notification) => ({
    ...notification,
    users: usersMap.get(notification.user_id) || null,
  }))
}

export function buildNotificationsActiveFilter(now: string) {
  return `expires_at.is.null,expires_at.gt.${now}`
}
