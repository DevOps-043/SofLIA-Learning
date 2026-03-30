import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { getServerClient } from './auto-notifications-server-client'

/**
 * Notificaciones automáticas relacionadas con contenido publicado
 * (noticias, reels y prompts de IA).
 */
export class ContentNotificationsService {
  /**
   * Crea notificaciones para usuarios cuando se publica una noticia
   */
  static async notifyNewsPublished(
    newsId: string,
    newsTitle: string,
    metadata?: Record<string, any>
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

      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'news_published',
        title: 'Nueva noticia publicada',
        message: `Lee la nueva noticia: "${newsTitle}"`,
        metadata: {
          ...metadata,
          news_id: newsId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('news_published')
      }))

      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de noticia publicada creadas', {
        newsId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de noticia publicada:', error)
    }
  }

  /**
   * Crea una notificación cuando una noticia es destacada.
   * Notifica al autor de la noticia.
   */
  static async notifyNewsFeatured(
    newsId: string,
    newsAuthorId: string,
    newsTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId: newsAuthorId,
        notificationType: 'news_featured',
        title: 'Tu noticia fue destacada',
        message: `Tu noticia "${newsTitle}" ha sido destacada. ¡Felicidades!`,
        metadata: {
          ...metadata,
          news_id: newsId,
          news_title: newsTitle,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('news_featured')
      })

      logger.info('✅ Notificación de noticia destacada creada', {
        newsId,
        newsAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de noticia destacada:', error)
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se crea un reel
   */
  static async notifyReelCreated(
    reelId: string,
    reelTitle: string,
    authorId: string,
    metadata?: Record<string, any>
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

      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'reel_created',
        title: 'Nuevo reel disponible',
        message: `${authorName} publicó un nuevo reel: "${reelTitle}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_created')
      }))

      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de reel creado creadas', {
        reelId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de reel creado:', error)
    }
  }

  /**
   * Crea una notificación cuando se da like a un reel.
   * Notifica al autor del reel (no al que da like).
   */
  static async notifyReelLiked(
    reelId: string,
    reelAuthorId: string,
    likeAuthorId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (reelAuthorId === likeAuthorId) {
        return
      }

      const supabase = await getServerClient()

      const { data: likeAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', likeAuthorId)
        .single()

      const likeAuthorName = likeAuthor?.display_name || likeAuthor?.first_name || likeAuthor?.username || 'Un usuario'

      const { data: reel } = await supabase
        .from('reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'

      await NotificationService.createNotification({
        userId: reelAuthorId,
        notificationType: 'reel_liked',
        title: 'Nuevo like en tu reel',
        message: `${likeAuthorName} le dio like a "${reelTitle}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          like_author_id: likeAuthorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_liked')
      })

      logger.info('✅ Notificación de like en reel creada', {
        reelId,
        reelAuthorId,
        likeAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de like en reel:', error)
    }
  }

  /**
   * Crea una notificación cuando se comenta un reel.
   * Notifica al autor del reel.
   */
  static async notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (reelAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()

      const { data: commentAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', commentAuthorId)
        .single()

      const commentAuthorName = commentAuthor?.display_name || commentAuthor?.first_name || commentAuthor?.username || 'Un usuario'

      const { data: reel } = await supabase
        .from('reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'

      const truncatedPreview = commentPreview.length > 100
        ? commentPreview.substring(0, 100) + '...'
        : commentPreview

      await NotificationService.createNotification({
        userId: reelAuthorId,
        notificationType: 'reel_comment',
        title: 'Nuevo comentario en tu reel',
        message: `${commentAuthorName} comentó en "${reelTitle}": "${truncatedPreview}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          comment_id: commentId,
          comment_author_id: commentAuthorId,
          comment_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_comment')
      })

      logger.info('✅ Notificación de comentario en reel creada', {
        reelId,
        commentId,
        reelAuthorId,
        commentAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de comentario en reel:', error)
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se crea un prompt
   */
  static async notifyPromptCreated(
    promptId: string,
    promptTitle: string,
    authorId: string,
    metadata?: Record<string, any>
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

      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'prompt_created',
        title: 'Nuevo prompt de IA disponible',
        message: `${authorName} creó un nuevo prompt: "${promptTitle}"`,
        metadata: {
          ...metadata,
          prompt_id: promptId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('prompt_created')
      }))

      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de prompt creado creadas', {
        promptId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de prompt creado:', error)
    }
  }

  /**
   * Crea una notificación cuando se marca un prompt como favorito.
   * Notifica al autor del prompt.
   */
  static async notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (promptAuthorId === favoritedByUserId) {
        return
      }

      const supabase = await getServerClient()

      const { data: favoritedBy } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', favoritedByUserId)
        .single()

      const favoritedByName = favoritedBy?.display_name || favoritedBy?.first_name || favoritedBy?.username || 'Un usuario'

      await NotificationService.createNotification({
        userId: promptAuthorId,
        notificationType: 'prompt_favorited',
        title: 'Tu prompt fue marcado como favorito',
        message: `${favoritedByName} marcó como favorito tu prompt "${promptTitle}"`,
        metadata: {
          ...metadata,
          prompt_id: promptId,
          prompt_title: promptTitle,
          favorited_by_user_id: favoritedByUserId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('prompt_favorited')
      })

      logger.info('✅ Notificación de prompt favorited creada', {
        promptId,
        promptAuthorId,
        favoritedByUserId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de prompt favorited:', error)
    }
  }
}
