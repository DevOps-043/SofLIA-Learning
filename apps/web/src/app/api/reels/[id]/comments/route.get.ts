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
