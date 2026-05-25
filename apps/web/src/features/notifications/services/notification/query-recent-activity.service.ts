import { logger } from '../../../../lib/logger'
import { getSystemNotificationClient } from '../auto-notifications-server-client'
import { NOTIFICATION_SELECT } from './select'
import {
  attachUsersToNotifications,
  filterExpiredNotifications,
} from './utils'

export async function getRecentActivity(limit = 10) {
  const supabase = await getSystemNotificationClient()
  const { data, error } = await supabase
    .from('user_notifications')
    .select(NOTIFICATION_SELECT)
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
