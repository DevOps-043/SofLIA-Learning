import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import {
  attachUsersToNotifications,
  buildNotificationsActiveFilter,
  filterExpiredNotifications,
  normalizeNotificationFilters,
} from './utils'
import type { Notification, NotificationFilters } from './types'

async function getUnreadCountFallback(userId: string) {
  const supabase = await getServerClient()
  const now = new Date().toISOString()
  const activeFilter = buildNotificationsActiveFilter(now)

  const [totalResult, criticalResult, highResult] = await Promise.all([
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .eq('priority', 'critical')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .eq('priority', 'high')
      .or(activeFilter),
  ])

  if (totalResult.error || criticalResult.error || highResult.error) {
    logger.error('Error en fallback count:', {
      totalError: totalResult.error,
      criticalError: criticalResult.error,
      highError: highResult.error,
    })
  }

  return {
    total: totalResult.count || 0,
    critical: criticalResult.count || 0,
    high: highResult.count || 0,
  }
}

export async function getUserNotifications(
  userId: string,
  filters?: NotificationFilters,
) {
  const supabase = await getServerClient()
  const now = new Date().toISOString()
  const activeFilter = buildNotificationsActiveFilter(now)
  const normalizedFilters = normalizeNotificationFilters(filters)

  let query = supabase
    .from('user_notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .or(activeFilter)

  if (normalizedFilters.status) {
    query = query.eq('status', normalizedFilters.status)
  }

  if (normalizedFilters.notificationType) {
    query = query.eq('notification_type', normalizedFilters.notificationType)
  }

  if (normalizedFilters.priority) {
    query = query.eq('priority', normalizedFilters.priority)
  }

  if (normalizedFilters.orderBy === 'priority') {
    query = query
      .order('priority', { ascending: normalizedFilters.orderDirection === 'asc' })
      .order('created_at', {
        ascending: normalizedFilters.orderDirection === 'asc',
      })
  } else {
    query = query.order(normalizedFilters.orderBy, {
      ascending: normalizedFilters.orderDirection === 'asc',
    })
  }

  query = query.range(
    normalizedFilters.offset,
    normalizedFilters.offset + normalizedFilters.limit - 1,
  )

  const { data, error, count } = await query
  if (error) {
    logger.error('Error obteniendo notificaciones:', error)
    throw new Error(`Error al obtener notificaciones: ${error.message}`)
  }

  return {
    notifications: (data || []) as Notification[],
    total: count || 0,
  }
}

export async function getUnreadCount(userId: string) {
  const supabase = await getServerClient()
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: { p_user_id: string },
    ) => { single: () => Promise<{ data: { total?: number; critical?: number; high?: number } | null; error: unknown | null }> }
  }

  try {
    const { data, error } = await rpcClient
      .rpc('get_unread_notifications_count', { p_user_id: userId })
      .single()

    if (error) {
      logger.warn('RPC no disponible, usando query tradicional', { error })
      return getUnreadCountFallback(userId)
    }

    const counts = data ?? {}

    return {
      total: Number(counts.total) || 0,
      critical: Number(counts.critical) || 0,
      high: Number(counts.high) || 0,
    }
  } catch (error) {
    logger.error('Error en getUnreadCount:', error)
    try {
      return await getUnreadCountFallback(userId)
    } catch (fallbackError) {
      logger.error('Fallback tambien fallo:', fallbackError)
      return { total: 0, critical: 0, high: 0 }
    }
  }
}

export async function getRecentActivity(limit = 10) {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Error obteniendo actividad reciente:', error)
    throw new Error(`Error al obtener actividad reciente: ${error.message}`)
  }

  const validNotifications = filterExpiredNotifications(data || [])
  if (!validNotifications.length) {
    return []
  }

  const userIds = [...new Set(validNotifications.map((notification) => notification.user_id))]
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, first_name, last_name, display_name, username')
    .in('id', userIds)

  if (usersError || !users) {
    return validNotifications
  }

  return attachUsersToNotifications(validNotifications, users)
}
