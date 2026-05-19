import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

import { reelCommentSchema, type ReelCommentBody } from '../../_schemas'

type RouteContext = { params: Promise<{ id: string }> }

async function handlePost(
  _request: NextRequest,
  body: ReelCommentBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { content } = body

    // Verificar autenticacion - OBLIGATORIA
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('Intento de crear comentario sin autenticacion')
      return apiError(
        'UNAUTHENTICATED',
        'Debes estar autenticado para comentar',
        401,
      )
    }

    const userId = user.id
    logger.log(`Usuario autenticado para comentario: ${userId} (${user.username || user.email})`)

    // Crear el comentario
    const { data: newComment, error: insertError } = await supabase
      .from('reel_comments')
      .insert({
        reel_id: id,
        user_id: userId,
        content,
      })
      .select(`
        id,
        content,
        created_at,
        users (
          id,
          username,
          profile_picture_url
        )
      `)
      .single()

    if (insertError) {
      logger.error('Error creating comment:', insertError)
      return apiError('REEL_COMMENT_CREATE_FAILED', 'Error interno', 500)
    }

    // Verificar que el JOIN con users esta funcionando en la respuesta
    if (newComment?.users) {
      logger.log(`Comentario creado con usuario: ${newComment.users.username || newComment.users.id} (${newComment.users.id})`)
    } else {
      logger.warn('Comentario creado pero sin informacion de usuario en la respuesta')
    }

    // Calcular el nuevo contador total (comentarios + respuestas)
    const { data: commentsCount, error: commentsError } = await supabase
      .from('reel_comments')
      .select('id', { count: 'exact' })
      .eq('reel_id', id)
      .eq('is_active', true)

    if (commentsError) {
      logger.error('Error counting comments:', commentsError)
      return apiError('REEL_COMMENT_COUNT_FAILED', 'Error interno', 500)
    }

    // Contar respuestas de todos los comentarios de este reel
    const { data: repliesCount, error: repliesError } = await supabase
      .from('reel_comment_replies')
      .select('id', { count: 'exact' })
      .in('comment_id', commentsCount?.map(c => c.id) || [])
      .eq('is_active', true)

    if (repliesError) {
      logger.error('Error counting replies:', repliesError)
      return apiError('REEL_REPLY_COUNT_FAILED', 'Error interno', 500)
    }

    const totalCount = (commentsCount?.length || 0) + (repliesCount?.length || 0)

    const { error: updateError } = await supabase
      .from('reels')
      .update({
        comment_count: totalCount,
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Error updating comment count:', updateError)
      return apiError('REEL_COMMENT_COUNT_UPDATE_FAILED', 'Error interno', 500)
    }

    // Crear notificacion para el autor del reel (en background)
    (async () => {
      try {
        // Obtener informacion del reel para saber quien es el autor
        const { data: reel } = await supabase
          .from('reels')
          .select('user_id')
          .eq('id', id)
          .single();

        if (reel && reel.user_id && reel.user_id !== userId) {
          const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service');
          await AutoNotificationsService.notifyReelComment(
            id,
            newComment.id,
            reel.user_id,
            userId,
            content,
          );
        }
      } catch (notificationError) {
        // Error silenciado para no afectar el flujo principal
      }
    })().catch(() => {}); // Fire and forget

    return NextResponse.json(newComment)
  } catch (error) {
    logger.error('Error in POST /api/reels/[id]/comments:', error)
    return apiError('REEL_COMMENT_CREATE_FAILED', 'Error interno', 500)
  }
}

export const POST = withZodBody(reelCommentSchema, handlePost)
