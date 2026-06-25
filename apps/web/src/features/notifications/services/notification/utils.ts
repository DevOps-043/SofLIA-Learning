import type { Json } from '../../../../lib/supabase/types'
import type { CreateNotificationParams } from './types'
import {
  EXTERNAL_NOTIFICATION_CHANNELS,
  getDefaultNotificationChannels,
  normalizeNotificationChannels,
  type ExternalNotificationChannel,
} from './catalog'

export const NON_DUPLICATE_NOTIFICATION_TYPES: Record<string, number> = {
  system_login_success: 60,
  system_login_unusual: 1440,
  system_login_failed: 1,
  system_password_changed: 1,
  system_email_verified: 1,
  certificate_generated: 1440,
  learning_daily_summary: 1440,
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
  dedup_key: string | null
  expires_at: string | null
  organization_id: string | null
  group_id: string | null
} {
  const channels = normalizeNotificationChannels(
    params.channels ?? getDefaultNotificationChannels(params.notificationType),
  )
  const externalChannels = channels.filter((channel): channel is ExternalNotificationChannel =>
    EXTERNAL_NOTIFICATION_CHANNELS.includes(channel as ExternalNotificationChannel),
  )

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
    channels_sent: (channels.includes('in_app') ? ['in_app'] : []) as Json,
    channels_pending: externalChannels as Json,
    dedup_key: params.dedupKey?.trim() || null,
    expires_at: params.expiresAt || null,
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
