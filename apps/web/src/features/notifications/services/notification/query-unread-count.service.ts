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
  try {
    return await getUnreadCountFallback(userId)
  } catch (error) {
    logger.error('Error en getUnreadCount:', error)
    return { total: 0, critical: 0, high: 0 }
  }
}
