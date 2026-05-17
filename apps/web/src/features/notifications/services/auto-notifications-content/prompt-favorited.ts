import { getNotificationPriority } from '../../utils/notification-categories'
import { logger } from '@/lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import {
  dispatchNotifications,
  fetchNotificationActorName,
  type NotificationMetadata,
} from '../auto-notifications.shared'

export async function notifyPromptFavorited(
  promptId: string,
  promptAuthorId: string,
  favoritedByUserId: string,
  promptTitle: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    if (promptAuthorId === favoritedByUserId) return

    const supabase = await getServerClient()
    const favoritedByName = await fetchNotificationActorName(
      supabase,
      favoritedByUserId,
    )

    await dispatchNotifications([
      {
        userId: promptAuthorId,
        notificationType: 'prompt_favorited',
        title: 'notifications.types.prompt_favorited.title',
        message: 'notifications.types.prompt_favorited.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          favoritedByName,
          promptTitle,
          prompt_id: promptId,
          prompt_title: promptTitle,
          favorited_by_user_id: favoritedByUserId,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('prompt_favorited'),
      },
    ])

    logger.info('Notificacion de prompt favorito creada', {
      promptId,
      promptAuthorId,
      favoritedByUserId,
    })
  } catch (error) {
    logger.error('Error creando notificacion de prompt favorito:', error)
  }
}
