import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Obtener comentarios del reel con información del usuario
    const { data: comments, error } = await supabase
      .from('reel_comments')
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
      .eq('reel_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Verificar que el JOIN con users está funcionando correctamente
    if (comments && comments.length > 0) {
      logger.log(`📊 Comentarios obtenidos: ${comments.length}`)
      comments.forEach((comment, index: number) => {
        if (comment.users) {
          logger.log(`  ${index + 1}. Usuario: ${comment.users.username || comment.users.id} (${comment.users.id})`)
        } else {
          logger.warn(`  ⚠️ Comentario ${comment.id} sin información de usuario`)
        }
      })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    logger.error('Error in GET /api/reels/[id]/comments:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 })
    }

    // Verificar autenticación - OBLIGATORIA
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('❌ Intento de crear comentario sin autenticación')
      return NextResponse.json(
        { error: 'Debes estar autenticado para comentar' },
        { status: 401 }
      )
    }

    const userId = user.id
    logger.log(`✅ Usuario autenticado para comentario: ${userId} (${user.username || user.email})`)

    // Crear el comentario
    const { data: newComment, error: insertError } = await supabase
      .from('reel_comments')
      .insert({
        reel_id: id,
        user_id: userId,
        content: content.trim()
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
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Verificar que el JOIN con users está funcionando en la respuesta
    if (newComment?.users) {
      logger.log(`✅ Comentario creado con usuario: ${newComment.users.username || newComment.users.id} (${newComment.users.id})`)
    } else {
      logger.warn('⚠️ Comentario creado pero sin información de usuario en la respuesta')
    }

    // Calcular el nuevo contador total (comentarios + respuestas)
    const { data: commentsCount, error: commentsError } = await supabase
      .from('reel_comments')
      .select('id', { count: 'exact' })
      .eq('reel_id', id)
      .eq('is_active', true)

    if (commentsError) {
      logger.error('Error counting comments:', commentsError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Contar respuestas de todos los comentarios de este reel
    const { data: repliesCount, error: repliesError } = await supabase
      .from('reel_comment_replies')
      .select('id', { count: 'exact' })
      .in('comment_id', commentsCount?.map(c => c.id) || [])
      .eq('is_active', true)

    if (repliesError) {
      logger.error('Error counting replies:', repliesError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    const totalCount = (commentsCount?.length || 0) + (repliesCount?.length || 0)
    
    const { error: updateError } = await supabase
      .from('reels')
      .update({ 
        comment_count: totalCount
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Error updating comment count:', updateError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Crear notificación para el autor del reel (en background)
    (async () => {
      try {
        // Obtener información del reel para saber quién es el autor
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
            content.trim()
          );
        }
      } catch (notificationError) {
        // Error silenciado para no afectar el flujo principal
      }
    })().catch(() => {}); // Fire and forget

    return NextResponse.json(newComment)
  } catch (error) {
    logger.error('Error in POST /api/reels/[id]/comments:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
