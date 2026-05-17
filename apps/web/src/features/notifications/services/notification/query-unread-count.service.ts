import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import { buildNotificationsActiveFilter } from './utils'

async function getUnreadCountFallback(userId: string) {
  const supabase = await getServerClient()
  const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())
  const [totalResult, criticalResult, highResult] = await Promise.all([
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .eq('priority', 'critical')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
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

    return {
      total: Number(data?.total) || 0,
      critical: Number(data?.critical) || 0,
      high: Number(data?.high) || 0,
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
