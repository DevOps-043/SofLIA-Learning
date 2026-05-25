import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import { NOTIFICATION_SELECT } from './select'
import {
  buildNextNotificationCursor,
  buildNotificationsActiveFilter,
  normalizeNotificationFilters,
  parseNotificationCursor,
  shouldUseNotificationCursorPagination,
} from './utils'
import type {
  Notification,
  NotificationFilters,
  NotificationQueryResult,
} from './types'

export async function getUserNotifications(
  userId: string,
  filters?: NotificationFilters,
): Promise<NotificationQueryResult> {
  const supabase = await getServerClient()
  const normalizedFilters = normalizeNotificationFilters(filters)
  const useCursorPagination = shouldUseNotificationCursorPagination(normalizedFilters)
  let query = supabase
    .from('user_notifications')
    .select(NOTIFICATION_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .or(buildNotificationsActiveFilter(new Date().toISOString()))

  if (normalizedFilters.status) query = query.eq('status', normalizedFilters.status)
  if (normalizedFilters.notificationType) query = query.eq('notification_type', normalizedFilters.notificationType)
  if (normalizedFilters.priority) query = query.eq('priority', normalizedFilters.priority)

  if (normalizedFilters.orderBy === 'priority') {
    query = query
      .order('priority', { ascending: normalizedFilters.orderDirection === 'asc' })
      .order('created_at', { ascending: normalizedFilters.orderDirection === 'asc' })
  } else {
    query = query.order(normalizedFilters.orderBy, {
      ascending: normalizedFilters.orderDirection === 'asc',
    })
  }

  if (useCursorPagination) {
    const cursor = parseNotificationCursor(normalizedFilters.cursor)
    if (cursor) {
      query = normalizedFilters.orderDirection === 'asc'
        ? query.gt('created_at', cursor.createdAt)
        : query.lt('created_at', cursor.createdAt)
    }
    query = query.limit(normalizedFilters.limit + 1)
  } else {
    query = query.range(
      normalizedFilters.offset,
      normalizedFilters.offset + normalizedFilters.limit - 1,
    )
  }

  const { data, error, count } = await query
  if (error) {
    logger.error('Error obteniendo notificaciones:', error)
    throw new Error(`Error al obtener notificaciones: ${error.message}`)
  }

  const notifications = (data || []) as Notification[]
  const paginatedNotifications = useCursorPagination
    ? notifications.slice(0, normalizedFilters.limit)
    : notifications
  const hasMore = useCursorPagination
    ? notifications.length > normalizedFilters.limit
    : normalizedFilters.offset + normalizedFilters.limit < (count || 0)

  return {
    notifications: paginatedNotifications,
    total: count || 0,
    hasMore,
    nextCursor: useCursorPagination && hasMore
      ? buildNextNotificationCursor(paginatedNotifications)
      : null,
  }
}
