import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { getServerClient } from './auto-notifications-server-client'
import {
  dispatchNotifications,
  dispatchNotificationsInChunks,
  fetchNotificationActorName,
  type NotificationMetadata,
  truncateNotificationPreview,
} from './auto-notifications.shared'

interface SimpleUserRow {
  id: string
}

interface ReelRow {
  title: string | null
}

/**
 * Notificaciones automaticas relacionadas con contenido publicado.
 */
export class ContentNotificationsService {
  /**
   * Crea notificaciones para usuarios cuando se publica una noticia.
   */
  static async notifyNewsPublished(
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

  /**
   * Crea una notificacion cuando una noticia es destacada.
   * Notifica al autor de la noticia.
   */
  static async notifyNewsFeatured(
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

      logger.info('Notificacion de noticia destacada creada', {
        newsId,
        newsAuthorId,
      })
    } catch (error) {
      logger.error('Error creando notificacion de noticia destacada:', error)
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se crea un reel.
   */
  static async notifyReelCreated(
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

  /**
   * Crea una notificacion cuando se da like a un reel.
   * Notifica al autor del reel, no al que da like.
   */
  static async notifyReelLiked(
    reelId: string,
    reelAuthorId: string,
    likeAuthorId: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    try {
      if (reelAuthorId === likeAuthorId) {
        return
      }

      const supabase = await getServerClient()
      const likeAuthorName = await fetchNotificationActorName(supabase, likeAuthorId)

      const { data: reel } = await fromLoose<ReelRow>(supabase, 'reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'

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
            reelTitle,
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

  /**
   * Crea una notificacion cuando se comenta un reel.
   * Notifica al autor del reel.
   */
  static async notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    try {
      if (reelAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()
      const commentAuthorName = await fetchNotificationActorName(supabase, commentAuthorId)

      const { data: reel } = await fromLoose<ReelRow>(supabase, 'reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'
      const truncatedPreview = truncateNotificationPreview(commentPreview)

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
            reelTitle,
            reel_id: reelId,
            comment_id: commentId,
            comment_author_id: commentAuthorId,
            comment_preview: truncatedPreview,
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

  /**
   * Crea notificaciones para usuarios cuando se crea un prompt.
   */
  static async notifyPromptCreated(
    promptId: string,
    promptTitle: string,
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
        logger.error('Error obteniendo usuarios para notificar prompt:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre el prompt', { promptId })
        return
      }

      const authorName = await fetchNotificationActorName(supabase, authorId)

      const notifications = users.map((user: SimpleUserRow) => ({
        userId: user.id,
        notificationType: 'prompt_created',
        title: 'notifications.types.prompt_created.title',
        message: 'notifications.types.prompt_created.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          authorName,
          promptTitle,
          prompt_id: promptId,
          author_id: authorId,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('prompt_created'),
      }))

      await dispatchNotificationsInChunks(notifications)

      logger.info('Notificaciones de prompt creado creadas', {
        promptId,
        count: notifications.length,
      })
    } catch (error) {
      logger.error('Error creando notificaciones de prompt creado:', error)
    }
  }

  /**
   * Crea una notificacion cuando se marca un prompt como favorito.
   * Notifica al autor del prompt.
   */
  static async notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: NotificationMetadata,
  ): Promise<void> {
    try {
      if (promptAuthorId === favoritedByUserId) {
        return
      }

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
}
