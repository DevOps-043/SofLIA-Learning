import { logger } from '@/lib/logger'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { getNotificationPriority } from '../../utils/notification-categories'
import { getServerClient } from '../auto-notifications-server-client'
import {
  dispatchNotifications,
  fetchNotificationActorName,
  truncateNotificationPreview,
  type NotificationMetadata,
} from '../auto-notifications.shared'
import type { ReelRow } from './types'

export async function notifyReelComment(
  reelId: string,
  commentId: string,
  reelAuthorId: string,
  commentAuthorId: string,
  commentPreview: string,
  metadata?: NotificationMetadata,
): Promise<void> {
  try {
    if (reelAuthorId === commentAuthorId) return

    const supabase = await getServerClient()
    const commentAuthorName = await fetchNotificationActorName(
      supabase,
      commentAuthorId,
    )
    const { data: reel } = await fromLoose<ReelRow>(supabase, 'reels')
      .select('title')
      .eq('id', reelId)
      .single()

    await dispatchNotifications([
      {
        userId: reelAuthorId,
        notificationType: 'reel_comment',
        title: 'notifications.types.reel_comment.title',
        message: 'notifications.types.reel_comment.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          commentAuthorName,
          reelTitle: reel?.title || 'tu reel',
          reel_id: reelId,
          comment_id: commentId,
          comment_author_id: commentAuthorId,
          comment_preview: truncateNotificationPreview(commentPreview),
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('reel_comment'),
      },
    ])

    logger.info('Notificacion de comentario en reel creada', {
      reelId,
      commentId,
      reelAuthorId,
      commentAuthorId,
    })
  } catch (error) {
    logger.error('Error creando notificacion de comentario en reel:', error)
  }
}
