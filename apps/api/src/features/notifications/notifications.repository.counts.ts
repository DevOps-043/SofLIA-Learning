import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'

import { buildNotificationsActiveFilter } from './notifications.utils'
import type {
  NotificationDbClient,
  NotificationRpcClient,
} from './notifications.repository.contract'
import type { NotificationPriority } from './notifications.types'

async function countUnreadNotifications(
  client: NotificationDbClient,
  userId: string,
  priority?: NotificationPriority,
) {
  const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())
  let query = client
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'unread')
    .or(activeFilter)

  if (priority) {
    query = query.eq('priority', priority)
  }

  const { count, error } = await query

  if (error) {
    throw new DatabaseError('Error al contar notificaciones no leidas', error)
  }

  return count ?? 0
}

async function getUnreadCountFallback(client: NotificationDbClient, userId: string) {
  const [total, critical, high] = await Promise.all([
    countUnreadNotifications(client, userId),
    countUnreadNotifications(client, userId, 'critical'),
    countUnreadNotifications(client, userId, 'high'),
  ])

  return { total, critical, high }
}

export async function getUnreadCount(
  client: NotificationDbClient,
  userId: string,
) {
  const rpcClient = client as NotificationRpcClient

  try {
    const { data, error } = await rpcClient
      .rpc('get_unread_notification_counts', { p_user_id: userId })
      .single()

    if (!error) {
      return {
        total: Number(data?.total) || 0,
        critical: Number(data?.critical) || 0,
        high: Number(data?.high) || 0,
      }
    }

    logger.warn('RPC get_unread_notification_counts no disponible', { error })
  } catch (error) {
    logger.warn('Fallo la RPC get_unread_notification_counts', { error })
  }

  return getUnreadCountFallback(client, userId)
}

export { countUnreadNotifications }
