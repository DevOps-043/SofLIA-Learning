import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'

import { buildNotificationsActiveFilter } from './notifications.utils'
import { countUnreadNotifications } from './notifications.repository.counts'
import type {
  NotificationDbClient,
  NotificationRpcClient,
} from './notifications.repository.contract'

async function markAllAsReadFallback(
  client: NotificationDbClient,
  userId: string,
  nowIso: string,
) {
  const totalToUpdate = await countUnreadNotifications(client, userId)

  if (totalToUpdate === 0) {
    return { updated: 0 }
  }

  const { error } = await client
    .from('user_notifications')
    .update({ status: 'read', read_at: nowIso, updated_at: nowIso })
    .eq('user_id', userId)
    .eq('status', 'unread')
    .or(buildNotificationsActiveFilter(nowIso))

  if (error) {
    throw new DatabaseError(
      'Error al marcar todas las notificaciones como leidas',
      error,
    )
  }

  return { updated: totalToUpdate }
}

export async function markAllAsRead(
  client: NotificationDbClient,
  userId: string,
  nowIso: string,
) {
  const rpcClient = client as NotificationRpcClient

  try {
    const { data, error } = await rpcClient
      .rpc('mark_all_notifications_read', { p_user_id: userId })
      .single()

    if (!error) {
      return { updated: Number(data?.updated_count) || 0 }
    }

    logger.warn('RPC mark_all_notifications_read no disponible', { error })
  } catch (error) {
    logger.warn('Fallo la RPC mark_all_notifications_read', { error })
  }

  return markAllAsReadFallback(client, userId, nowIso)
}
