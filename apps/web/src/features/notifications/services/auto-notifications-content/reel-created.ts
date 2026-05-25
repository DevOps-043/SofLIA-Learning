import { getNotificationPriority } from '../../utils/notification-categories'
import { logger } from '@/lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import {
  dispatchNotificationsInChunks,
  fetchNotificationActorName,
  type NotificationMetadata,
} from '../auto-notifications.shared'
import type { SimpleUserRow } from './types'

export async function notifyReelCreated(
  reelId: string,
  reelTitle: string,
  authorId: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    const supabase = await getServerClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('is_banned', false)
      .neq('id', authorId)
      .limit(500)

    if (error) {
      logger.error('Error obteniendo usuarios para notificar reel:', error)
      return
    }

    if (!users || users.length === 0) {
      logger.info('No hay usuarios para notificar sobre el reel', { reelId })
      return
    }

    const authorName = await fetchNotificationActorName(supabase, authorId)
    const notifications = users.map((user: SimpleUserRow) => ({
      userId: user.id,
      notificationType: 'reel_created',
      title: 'notifications.types.reel_created.title',
      message: 'notifications.types.reel_created.message',
      isLocalized: true,
      metadata: {
        ...metadata,
        authorName,
        reelTitle,
        reel_id: reelId,
        author_id: authorId,
        timestamp: new Date().toISOString(),
      },
      priority: getNotificationPriority('reel_created'),
    }))

    await dispatchNotificationsInChunks(notifications)
    logger.info('Notificaciones de reel creado creadas', {
      reelId,
      count: notifications.length,
    })
  } catch (error) {
    logger.error('Error creando notificaciones de reel creado:', error)
  }
}
