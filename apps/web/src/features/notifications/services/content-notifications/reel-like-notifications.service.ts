import { logger } from '@/lib/logger'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { getNotificationPriority } from '../../utils/notification-categories'
import { getServerClient } from '../auto-notifications-server-client'
import {
  dispatchNotifications,
  fetchNotificationActorName,
  type NotificationMetadata,
} from '../auto-notifications.shared'
import type { ReelRow } from './types'

export async function notifyReelLiked(
  reelId: string,
  reelAuthorId: string,
  likeAuthorId: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    if (reelAuthorId === likeAuthorId) return

    const supabase = await getServerClient()
    const likeAuthorName = await fetchNotificationActorName(supabase, likeAuthorId)
    const { data: reel } = await fromLoose<ReelRow>(supabase, 'reels')
      .select('title')
      .eq('id', reelId)
      .single()

    await dispatchNotifications([
      {
        userId: reelAuthorId,
        notificationType: 'reel_liked',
        title: 'notifications.types.reel_liked.title',
        message: 'notifications.types.reel_liked.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          likeAuthorName,
          reelTitle: reel?.title || 'tu reel',
          reel_id: reelId,
          like_author_id: likeAuthorId,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('reel_liked'),
      },
    ])

    logger.info('Notificacion de like en reel creada', {
      reelId,
      reelAuthorId,
      likeAuthorId,
    })
  } catch (error) {
    logger.error('Error creando notificacion de like en reel:', error)
  }
}
