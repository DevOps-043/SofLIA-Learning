import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { SessionService } from '@/features/auth/services/session.service'

import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'La respuesta no puede estar vacía' }, { status: 400 })
    }

    // Verificar autenticación - OBLIGATORIA
    let user = null
    try {
      user = await SessionService.getCurrentUser()
    } catch (authError) {
      logger.error('Error getting current user:', authError)
    }

    if (!user || !user.id) {
      logger.warn('❌ Intento de crear respuesta sin autenticación')
      return NextResponse.json(
        { error: 'Debes estar autenticado para responder' },
        { status: 401 }
      )
    }

    const userId = user.id
    logger.log(`✅ Usuario autenticado para respuesta: ${userId} (${user.username || user.email})`)

    // Crear la respuesta
    const { data: newReply, error: insertError } = await supabase
      .from('reel_comment_replies')
      .insert({
        comment_id: id,
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
      logger.error('Error creating reply:', insertError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Verificar que el JOIN con users está funcionando en la respuesta
    if (newReply?.users) {
      logger.log(`✅ Respuesta creada con usuario: ${newReply.users.username || newReply.users.id} (${newReply.users.id})`)
    } else {
      logger.warn('⚠️ Respuesta creada pero sin información de usuario en la respuesta')
    }

    // Obtener el reel_id del comentario para actualizar el contador
    const { data: comment, error: commentError } = await supabase
      .from('reel_comments')
      .select('reel_id')
      .eq('id', id)
      .single()

    if (commentError) {
      logger.error('Error fetching comment:', commentError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Calcular el nuevo contador total (comentarios + respuestas)
    const { data: commentsCount, error: commentsError } = await supabase
      .from('reel_comments')
      .select('id', { count: 'exact' })
      .eq('reel_id', comment.reel_id)
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
      .eq('id', comment.reel_id)

    if (updateError) {
      logger.error('Error updating comment count:', updateError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json(newReply)
  } catch (error) {
    logger.error('Error in POST /api/reels/comments/[id]/replies:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
