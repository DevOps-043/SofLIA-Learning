import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { getServerClient } from './auto-notifications-server-client'
import {
  dispatchNotifications,
  fetchNotificationActorName,
  truncateNotificationPreview,
} from './auto-notifications.shared'

interface CommunityMemberRow {
  user_id: string
  role?: string | null
}

interface CommunityPostRow {
  title: string | null
}

/**
 * Notificaciones automaticas relacionadas con comunidades.
 */
export class CommunityNotificationsService {
  /**
   * Crea notificaciones para miembros de una comunidad cuando se crea un post.
   */
  static async notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const supabase = await getServerClient()

      const { data: members, error } = await fromLoose<CommunityMemberRow>(
        supabase,
        'community_members',
      )
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

      const authorName = await fetchNotificationActorName(supabase, authorId)

      const notifications = members.map((member) => ({
        userId: member.user_id,
        notificationType: 'community_post_created',
        title: 'Nuevo post en la comunidad',
        message: `${authorName} publico "${postTitle}" en la comunidad`,
        metadata: {
          ...metadata,
          post_id: postId,
          community_id: communityId,
          author_id: authorId,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('community_post_created'),
      }))

      await dispatchNotifications(notifications)

      logger.info('Notificaciones de post de comunidad creadas', {
        postId,
        communityId,
        count: notifications.length,
      })
    } catch (error) {
      logger.error('Error creando notificaciones de post de comunidad:', error)
    }
  }

  /**
   * Crea una notificacion cuando se comenta un post de comunidad.
   * Notifica al autor del post, no al que comenta.
   */
  static async notifyCommunityPostComment(
    postId: string,
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    communityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (postAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()
      const commentAuthorName = await fetchNotificationActorName(supabase, commentAuthorId)

      const { data: post } = await fromLoose<CommunityPostRow>(supabase, 'community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'
      const truncatedPreview = truncateNotificationPreview(commentPreview)

      await dispatchNotifications([
        {
          userId: postAuthorId,
          notificationType: 'community_post_comment',
          title: 'Nuevo comentario en tu post',
          message: `${commentAuthorName} comento en "${postTitle}": "${truncatedPreview}"`,
          metadata: {
            ...metadata,
            post_id: postId,
            comment_id: commentId,
            community_id: communityId,
            comment_author_id: commentAuthorId,
            comment_preview: truncatedPreview,
            timestamp: new Date().toISOString(),
          },
          priority: getNotificationPriority('community_post_comment'),
        },
      ])

      logger.info('Notificacion de comentario en post creada', {
        postId,
        commentId,
        postAuthorId,
        commentAuthorId,
      })
    } catch (error) {
      logger.error('Error creando notificacion de comentario en post:', error)
    }
  }

  /**
   * Crea una notificacion cuando se reacciona a un post de comunidad.
   * Notifica al autor del post.
   */
  static async notifyCommunityPostReaction(
    postId: string,
    postAuthorId: string,
    reactionAuthorId: string,
    reactionType: string,
    communityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (postAuthorId === reactionAuthorId) {
        return
      }

      const supabase = await getServerClient()
      const reactionAuthorName = await fetchNotificationActorName(supabase, reactionAuthorId)

      const reactionText: Record<string, string> = {
        like: 'le gusto',
        love: 'le encanto',
        laugh: 'se rio de',
        wow: 'se sorprendio con',
        sad: 'se entristecio con',
        angry: 'se enojo con',
      }

      const reactionVerb = reactionText[reactionType] || 'reacciono a'

      const { data: post } = await fromLoose<CommunityPostRow>(supabase, 'community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'

      await dispatchNotifications([
        {
          userId: postAuthorId,
          notificationType: 'community_post_reaction',
          title: 'Nueva reaccion en tu post',
          message: `${reactionAuthorName} ${reactionVerb} "${postTitle}"`,
          metadata: {
            ...metadata,
            post_id: postId,
            community_id: communityId,
            reaction_author_id: reactionAuthorId,
            reaction_type: reactionType,
            timestamp: new Date().toISOString(),
          },
          priority: getNotificationPriority('community_post_reaction'),
        },
      ])

      logger.info('Notificacion de reaccion en post creada', {
        postId,
        postAuthorId,
        reactionAuthorId,
        reactionType,
      })
    } catch (error) {
      logger.error('Error creando notificacion de reaccion en post:', error)
    }
  }

  /**
   * Crea notificaciones cuando un nuevo miembro se une a una comunidad.
   * Notifica a administradores y moderadores de la comunidad.
   */
  static async notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const supabase = await getServerClient()
      const newMemberName = await fetchNotificationActorName(
        supabase,
        newMemberId,
        'Un nuevo usuario',
      )

      const { data: adminsAndMods, error } = await fromLoose<CommunityMemberRow>(
        supabase,
        'community_members',
      )
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
          newMemberId,
        })
        return
      }

      const notifications = adminsAndMods.map((member) => ({
        userId: member.user_id,
        notificationType: 'community_member_joined',
        title: 'Nuevo miembro en la comunidad',
        message: `${newMemberName} se unio a la comunidad "${communityName}"`,
        metadata: {
          ...metadata,
          community_id: communityId,
          community_name: communityName,
          new_member_id: newMemberId,
          timestamp: new Date().toISOString(),
        },
        priority: getNotificationPriority('community_member_joined'),
      }))

      await dispatchNotifications(notifications)

      logger.info('Notificaciones de nuevo miembro en comunidad creadas', {
        communityId,
        newMemberId,
        count: notifications.length,
      })
    } catch (error) {
      logger.error('Error creando notificaciones de nuevo miembro en comunidad:', error)
    }
  }
}
