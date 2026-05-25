import type { Json } from '../../../../lib/supabase/types'
import type { CreateNotificationParams } from './types'

export const NON_DUPLICATE_NOTIFICATION_TYPES: Record<string, number> = {
  system_login_success: 5,
  system_login_failed: 1,
  system_password_changed: 1,
  system_email_verified: 1,
  learning_path_assigned: 60,
  org_invitation_received: 1440,
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
    metadata: {
      ...(params.metadata || {}),
      is_localized: params.isLocalized || false,
    } as Json,
    priority: params.priority || 'medium',
    status: 'unread' as const,
    channels_sent: [] as Json,
    channels_pending: [] as Json,
    organization_id: params.organizationId || null,
    group_id: params.groupId || null,
  }
}

export {
  buildNextNotificationCursor,
  encodeNotificationCursor,
  parseNotificationCursor,
} from './notification-cursor.utils'
export {
  buildNotificationsActiveFilter,
  normalizeNotificationFilters,
  shouldUseNotificationCursorPagination,
} from './notification-filter.utils'
export {
  attachUsersToNotifications,
  filterExpiredNotifications,
} from './notification-user.utils'
