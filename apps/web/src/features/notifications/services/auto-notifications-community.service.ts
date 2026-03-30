import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { getServerClient } from './auto-notifications-server-client'

/**
 * Notificaciones automáticas relacionadas con comunidades.
 */
export class CommunityNotificationsService {
  /**
   * Crea notificaciones para miembros de una comunidad cuando se crea un post
   */
  static async notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await getServerClient()

      const { data: members, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .neq('user_id', authorId)

      if (error) {
        logger.error('Error obteniendo miembros de comunidad:', error)
        return
      }

      if (!members || members.length === 0) {
        logger.info('No hay miembros para notificar sobre el post', { postId, communityId })
        return
      }

      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      const notifications = members.map(member => ({
        userId: member.user_id,
        notificationType: 'community_post_created',
        title: 'Nuevo post en la comunidad',
        message: `${authorName} publicó "${postTitle}" en la comunidad`,
        metadata: {
          ...metadata,
          post_id: postId,
          community_id: communityId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_created')
      }))

      for (const notification of notifications) {
        await NotificationService.createNotification(notification)
      }

      logger.info('✅ Notificaciones de post de comunidad creadas', {
        postId,
        communityId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de post de comunidad:', error)
    }
  }

  /**
   * Crea una notificación cuando se comenta un post de comunidad.
   * Notifica al autor del post (no al que comenta).
   */
  static async notifyCommunityPostComment(
    postId: string,
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    communityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (postAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()

      const { data: commentAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', commentAuthorId)
        .single()

      const commentAuthorName = commentAuthor?.display_name || commentAuthor?.first_name || commentAuthor?.username || 'Un usuario'

      const { data: post } = await supabase
        .from('community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'

      const truncatedPreview = commentPreview.length > 100
        ? commentPreview.substring(0, 100) + '...'
        : commentPreview

      await NotificationService.createNotification({
        userId: postAuthorId,
        notificationType: 'community_post_comment',
        title: 'Nuevo comentario en tu post',
        message: `${commentAuthorName} comentó en "${postTitle}": "${truncatedPreview}"`,
        metadata: {
          ...metadata,
          post_id: postId,
          comment_id: commentId,
          community_id: communityId,
          comment_author_id: commentAuthorId,
          comment_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_comment')
      })

      logger.info('✅ Notificación de comentario en post creada', {
        postId,
        commentId,
        postAuthorId,
        commentAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de comentario en post:', error)
    }
  }

  /**
   * Crea una notificación cuando se reacciona a un post de comunidad.
   * Notifica al autor del post.
   */
  static async notifyCommunityPostReaction(
    postId: string,
    postAuthorId: string,
    reactionAuthorId: string,
    reactionType: string,
    communityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (postAuthorId === reactionAuthorId) {
        return
      }

      const supabase = await getServerClient()

      const { data: reactionAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', reactionAuthorId)
        .single()

      const reactionAuthorName = reactionAuthor?.display_name || reactionAuthor?.first_name || reactionAuthor?.username || 'Un usuario'

      const reactionText: Record<string, string> = {
        'like': 'le gustó',
        'love': 'le encantó',
        'laugh': 'se rió de',
        'wow': 'se sorprendió con',
        'sad': 'se entristeció con',
        'angry': 'se enojó con'
      }

      const reactionVerb = reactionText[reactionType] || 'reaccionó a'

      const { data: post } = await supabase
        .from('community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'

      await NotificationService.createNotification({
        userId: postAuthorId,
        notificationType: 'community_post_reaction',
        title: 'Nueva reacción en tu post',
        message: `${reactionAuthorName} ${reactionVerb} "${postTitle}"`,
        metadata: {
          ...metadata,
          post_id: postId,
          community_id: communityId,
          reaction_author_id: reactionAuthorId,
          reaction_type: reactionType,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_reaction')
      })

      logger.info('✅ Notificación de reacción en post creada', {
        postId,
        postAuthorId,
        reactionAuthorId,
        reactionType
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de reacción en post:', error)
    }
  }

  /**
   * Crea notificaciones cuando un nuevo miembro se une a una comunidad.
   * Notifica a los administradores y moderadores de la comunidad.
   */
  static async notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await getServerClient()

      const { data: newMember } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', newMemberId)
        .single()

      const newMemberName = newMember?.display_name || newMember?.first_name || newMember?.username || 'Un nuevo usuario'

      const { data: adminsAndMods, error } = await supabase
        .from('community_members')
        .select('user_id, role')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .in('role', ['admin', 'moderator'])

      if (error) {
        logger.error('Error obteniendo administradores/moderadores:', error)
        return
      }

      if (!adminsAndMods || adminsAndMods.length === 0) {
        logger.info('No hay administradores/moderadores para notificar sobre nuevo miembro', {
          communityId,
          newMemberId
        })
        return
      }

      const notifications = adminsAndMods.map(member => ({
        userId: member.user_id,
        notificationType: 'community_member_joined',
        title: 'Nuevo miembro en la comunidad',
        message: `${newMemberName} se unió a la comunidad "${communityName}"`,
        metadata: {
          ...metadata,
          community_id: communityId,
          community_name: communityName,
          new_member_id: newMemberId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_member_joined')
      }))

      for (const notification of notifications) {
        await NotificationService.createNotification(notification)
      }

      logger.info('✅ Notificaciones de nuevo miembro en comunidad creadas', {
        communityId,
        newMemberId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de nuevo miembro en comunidad:', error)
    }
  }
}
