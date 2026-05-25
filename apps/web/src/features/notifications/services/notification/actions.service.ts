import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import { NOTIFICATION_SELECT } from './select'
import { buildNotificationsActiveFilter } from './utils'
import type { Notification } from './types'

type NotificationSupabaseClient = Awaited<ReturnType<typeof getServerClient>>

interface NotificationActionOptions {
  supabase?: NotificationSupabaseClient
}

async function ensureNotificationOwnership(
  notificationId: string,
  userId: string,
  select = 'notification_id, status',
) {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('user_notifications')
    .select(select)
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Notificacion no encontrada o no pertenece al usuario')
  }

  return { supabase, notification: data as unknown as Notification }
}

async function resolveNotificationClient(options?: NotificationActionOptions) {
  return options?.supabase ?? await getServerClient()
}

async function markAllAsReadFallback(
  userId: string,
  options?: NotificationActionOptions,
) {
  const supabase = await resolveNotificationClient(options)
  const now = new Date().toISOString()
  const activeFilter = buildNotificationsActiveFilter(now)

  const { count, error: countError } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'unread')
    .or(activeFilter)

  if (countError) {
    logger.error('Error contando notificaciones en fallback:', countError)
    throw new Error(`Error al contar notificaciones: ${countError.message}`)
  }

  const totalToUpdate = count || 0
  if (totalToUpdate === 0) {
    return { updated: 0 }
  }

  const { error } = await supabase
    .from('user_notifications')
    .update({
      status: 'read',
      read_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('status', 'unread')
    .or(activeFilter)

  if (error) {
    logger.error('Error en fallback markAllAsRead:', error)
    throw new Error(`Error al marcar todas como leidas: ${error.message}`)
  }

  return { updated: totalToUpdate }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const { supabase, notification: existing } = await ensureNotificationOwnership(
    notificationId,
    userId,
  )

  if (existing.status === 'read') {
    const { data } = await supabase
      .from('user_notifications')
      .select(NOTIFICATION_SELECT)
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .single()

    return data as Notification
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Error marcando notificacion como leida:', error)
    throw new Error(`Error al marcar como leida: ${error.message}`)
  }

  return data as Notification
}

export async function markMultipleNotificationsAsRead(
  notificationIds: string[],
  userId: string,
) {
  if (!notificationIds.length) {
    return { updated: 0 }
  }

  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('user_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .in('notification_id', notificationIds)
    .eq('user_id', userId)
    .eq('status', 'unread')
    .select('notification_id')

  if (error) {
    logger.error('Error marcando notificaciones como leidas:', error)
    throw new Error(`Error al marcar como leidas: ${error.message}`)
  }

  return { updated: data?.length || 0 }
}

export async function archiveNotification(
  notificationId: string,
  userId: string,
) {
  const { supabase } = await ensureNotificationOwnership(
    notificationId,
    userId,
    'notification_id',
  )

  const { data, error } = await supabase
    .from('user_notifications')
    .update({ status: 'archived' })
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Error archivando notificacion:', error)
    throw new Error(`Error al archivar: ${error.message}`)
  }

  return data as Notification
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  const { supabase } = await ensureNotificationOwnership(
    notificationId,
    userId,
    'notification_id',
  )

  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('notification_id', notificationId)
    .eq('user_id', userId)

  if (error) {
    logger.error('Error eliminando notificacion:', error)
    throw new Error(`Error al eliminar: ${error.message}`)
  }
}

export async function markAllNotificationsAsRead(
  userId: string,
  options?: NotificationActionOptions,
) {
  const supabase = await resolveNotificationClient(options)
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: { p_user_id: string },
    ) => { single: () => Promise<{ data: { updated_count?: number } | null; error: unknown | null }> }
  }

  try {
    const { data, error } = await rpcClient
      .rpc('mark_all_notifications_read', { p_user_id: userId })
      .single()

    if (error) {
      logger.warn('RPC no disponible, usando update tradicional', { error })
      return markAllAsReadFallback(userId, options)
    }

    return { updated: Number(data?.updated_count) || 0 }
  } catch (error) {
    logger.error('Error en markAllAsRead:', error)
    return markAllAsReadFallback(userId, options)
  }
}
