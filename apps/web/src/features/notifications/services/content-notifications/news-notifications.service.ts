import { logger } from '@/lib/logger'
import { getNotificationPriority } from '../../utils/notification-categories'
import { getServerClient } from '../auto-notifications-server-client'
import {
  dispatchNotifications,
  dispatchNotificationsInChunks,
  type NotificationMetadata,
} from '../auto-notifications.shared'
import type { SimpleUserRow } from './types'

export async function notifyNewsPublished(
  newsId: string,
  newsTitle: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    const supabase = await getServerClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('is_banned', false)
      .limit(1000)

    if (error) {
      logger.error('Error obteniendo usuarios para notificar noticia:', error)
      return
    }

    if (!users || users.length === 0) {
      logger.info('No hay usuarios para notificar sobre la noticia', { newsId })
      return
    }

    const notifications = users.map((user: SimpleUserRow) => ({
      userId: user.id,
      notificationType: 'news_published',
      title: 'notifications.types.news_published.title',
      message: 'notifications.types.news_published.message',
      isLocalized: true,
      metadata: {
        ...metadata,
        newsTitle,
        news_id: newsId,
        timestamp: new Date().toISOString(),
      },
      priority: getNotificationPriority('news_published'),
    }))

    await dispatchNotificationsInChunks(notifications)
    logger.info('Notificaciones de noticia publicada creadas', {
      newsId,
      count: notifications.length,
    })
  } catch (error) {
    logger.error('Error creando notificaciones de noticia publicada:', error)
  }
}

export async function notifyNewsFeatured(
  newsId: string,
  newsAuthorId: string,
  newsTitle: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    await dispatchNotifications([
      {
        userId: newsAuthorId,
        notificationType: 'news_featured',
        title: 'notifications.types.news_featured.title',
        message: 'notifications.types.news_featured.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          newsTitle,
          news_id: newsId,
          news_title: newsTitle,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('news_featured'),
      },
    ])

    logger.info('Notificacion de noticia destacada creada', { newsId, newsAuthorId })
  } catch (error) {
    logger.error('Error creando notificacion de noticia destacada:', error)
  }
}
