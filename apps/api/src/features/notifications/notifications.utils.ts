import type { Json } from '@/core/supabase/database.types'
import type {
  CreateNotificationInput,
  NotificationFilters,
  NormalizedNotificationFilters,
  NotificationInsertPayload,
} from './notifications.types'

const DUPLICATE_NOTIFICATION_WINDOWS: Record<string, number> = {
  system_login_success: 5,
  system_login_failed: 1,
  system_password_changed: 1,
  system_email_verified: 1,
}

export function getDuplicateNotificationWindow(notificationType: string) {
  return DUPLICATE_NOTIFICATION_WINDOWS[notificationType]
}

export function buildNotificationInsertPayload(
  input: CreateNotificationInput,
): NotificationInsertPayload {
  return {
    user_id: input.userId,
    notification_type: input.notificationType,
    title: input.title.trim(),
    message: input.message.trim(),
    metadata: (input.metadata ?? {}) as Json,
    priority: input.priority ?? 'medium',
    status: 'unread',
    channels_sent: [] as Json,
    channels_pending: [] as Json,
    organization_id: input.organizationId ?? null,
    group_id: input.groupId ?? null,
  }
}

export function normalizeNotificationFilters(
  filters: NotificationFilters = {},
): NormalizedNotificationFilters {
  return {
    status: filters.status,
    notificationType: filters.notificationType,
    priority: filters.priority,
    limit:
      typeof filters.limit === 'number' && filters.limit > 0
        ? Math.min(filters.limit, 100)
        : 50,
    offset:
      typeof filters.offset === 'number' && filters.offset >= 0
        ? filters.offset
        : 0,
    orderBy: filters.orderBy ?? 'created_at',
    orderDirection: filters.orderDirection ?? 'desc',
  }
}

export function buildNotificationsActiveFilter(nowIso: string) {
  return `expires_at.is.null,expires_at.gt.${nowIso}`
}
