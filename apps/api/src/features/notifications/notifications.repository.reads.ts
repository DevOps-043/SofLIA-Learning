import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'

import { buildNotificationsActiveFilter } from './notifications.utils'
import type { NotificationDbClient } from './notifications.repository.contract'
import type {
  NormalizedNotificationFilters,
  Notification,
} from './notifications.types'

export async function findRecentDuplicate(
  client: NotificationDbClient,
  userId: string,
  notificationType: string,
  sinceIso: string,
) {
  const { data, error } = await client
    .from('user_notifications')
    .select('notification_id')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .gte('created_at', sinceIso)
    .limit(1)

  if (error) {
    logger.warn('No se pudo validar notificacion duplicada', {
      error,
      notificationType,
      userId,
    })
    return false
  }

  return (data?.length ?? 0) > 0
}

export async function findForUser(
  client: NotificationDbClient,
  userId: string,
  filters: NormalizedNotificationFilters,
) {
  const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())
  let query = client
    .from('user_notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .or(activeFilter)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.notificationType) {
    query = query.eq('notification_type', filters.notificationType)
  }
  if (filters.priority) query = query.eq('priority', filters.priority)

  if (filters.orderBy === 'priority') {
    query = query
      .order('priority', { ascending: filters.orderDirection === 'asc' })
      .order('created_at', { ascending: filters.orderDirection === 'asc' })
  } else {
    query = query.order(filters.orderBy, {
      ascending: filters.orderDirection === 'asc',
    })
  }

  const { data, error, count } = await query.range(
    filters.offset,
    filters.offset + filters.limit - 1,
  )

  if (error) {
    throw new DatabaseError('Error al obtener notificaciones', error)
  }

  return { notifications: (data ?? []) as Notification[], total: count ?? 0 }
}

export async function findByIdForUser(
  client: NotificationDbClient,
  notificationId: string,
  userId: string,
) {
  const { data, error } = await client
    .from('user_notifications')
    .select('*')
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new DatabaseError('Error al consultar la notificacion', error)
  }

  return (data as Notification | null) ?? null
}
