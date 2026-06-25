import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import { buildNotificationsActiveFilter } from './utils'
import type {
  NotificationDeleteMutationResult,
  NotificationStatusMutationResult,
} from './types'

type NotificationSupabaseClient = Awaited<ReturnType<typeof getServerClient>>

interface NotificationActionOptions {
  supabase?: NotificationSupabaseClient
}

async function resolveNotificationClient(options?: NotificationActionOptions) {
  return options?.supabase ?? await getServerClient()
}

function normalizeRpcStatusResult(
  data: { notification_id?: string; status?: string; updated?: boolean } | null,
  expectedStatus: 'read' | 'archived',
): NotificationStatusMutationResult | null {
  if (!data?.notification_id) {
    return null
  }

  return {
    notificationId: data.notification_id,
    status: expectedStatus,
    updated: Boolean(data.updated),
  }
}

async function runStatusMutationRpc(
  supabase: NotificationSupabaseClient,
  functionName: 'mark_notification_read' | 'archive_notification',
  notificationId: string,
  userId: string,
  expectedStatus: 'read' | 'archived',
) {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: { p_notification_id: string; p_user_id: string },
    ) => { single: () => Promise<{ data: { notification_id?: string; status?: string; updated?: boolean } | null; error: unknown | null }> }
  }

  let result: {
    data: { notification_id?: string; status?: string; updated?: boolean } | null
    error: unknown | null
  }

  try {
    result = await rpcClient
      .rpc(functionName, {
        p_notification_id: notificationId,
        p_user_id: userId,
      })
      .single()
  } catch (error) {
    logger.warn('Notification status RPC failed before fallback', {
      error,
      functionName,
    })
    return null
  }

  const { data, error } = result

  if (error) {
    logger.warn('Notification status RPC unavailable', {
      error,
      functionName,
    })
    return null
  }

  return normalizeRpcStatusResult(data, expectedStatus)
}

async function updateNotificationStatusFallback(
  notificationId: string,
  userId: string,
  status: 'read' | 'archived',
  options?: NotificationActionOptions,
): Promise<NotificationStatusMutationResult> {
  const supabase = await resolveNotificationClient(options)
  const now = new Date().toISOString()
  const patch =
    status === 'read'
      ? { status, read_at: now, updated_at: now }
      : { status, updated_at: now }

  const { data, error } = await supabase
    .from('user_notifications')
    .update(patch)
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .neq('status', status)
    .select('notification_id, status')
    .maybeSingle()

  if (error) {
    logger.error('Error actualizando estado de notificacion:', error)
    throw new Error(`Error al actualizar notificacion: ${error.message}`)
  }

  if (data?.notification_id) {
    return {
      notificationId: data.notification_id,
      status,
      updated: true,
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('user_notifications')
    .select('notification_id, status')
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError || !existing) {
    throw new Error('Notificacion no encontrada o no pertenece al usuario')
  }

  return {
    notificationId: existing.notification_id,
    status,
    updated: false,
  }
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
    .select('notification_id', { count: 'exact', head: true })
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
  options?: NotificationActionOptions,
) {
  const supabase = await resolveNotificationClient(options)
  const rpcResult = await runStatusMutationRpc(
    supabase,
    'mark_notification_read',
    notificationId,
    userId,
    'read',
  )

  if (rpcResult) {
    return rpcResult
  }

  return updateNotificationStatusFallback(notificationId, userId, 'read', {
    supabase,
  })
}

export async function markMultipleNotificationsAsRead(
  notificationIds: string[],
  userId: string,
  options?: NotificationActionOptions,
) {
  if (!notificationIds.length) {
    return { updated: 0 }
  }

  const supabase = await resolveNotificationClient(options)
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
  options?: NotificationActionOptions,
) {
  const supabase = await resolveNotificationClient(options)
  const rpcResult = await runStatusMutationRpc(
    supabase,
    'archive_notification',
    notificationId,
    userId,
    'archived',
  )

  if (rpcResult) {
    return rpcResult
  }

  return updateNotificationStatusFallback(notificationId, userId, 'archived', {
    supabase,
  })
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
  options?: NotificationActionOptions,
) {
  const supabase = await resolveNotificationClient(options)
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: { p_notification_id: string; p_user_id: string },
    ) => { single: () => Promise<{ data: { notification_id?: string; deleted?: boolean } | null; error: unknown | null }> }
  }

  try {
    const { data, error } = await rpcClient
      .rpc('delete_notification', {
        p_notification_id: notificationId,
        p_user_id: userId,
      })
      .single()

    if (!error && data?.deleted) {
      return {
        deleted: true,
        notificationId: data.notification_id || notificationId,
      } satisfies NotificationDeleteMutationResult
    }

    if (!error && data && !data.deleted) {
      throw new Error('Notificacion no encontrada o no pertenece al usuario')
    }

    if (error) {
      logger.warn('Notification delete RPC unavailable', { error })
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('no encontrada')
    ) {
      throw error
    }
    logger.warn('Notification delete RPC failed, using fallback', { error })
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .select('notification_id')
    .maybeSingle()

  if (error) {
    logger.error('Error eliminando notificacion:', error)
    throw new Error(`Error al eliminar: ${error.message}`)
  }

  if (!data?.notification_id) {
    throw new Error('Notificacion no encontrada o no pertenece al usuario')
  }

  return {
    deleted: true,
    notificationId: data.notification_id,
  } satisfies NotificationDeleteMutationResult
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
