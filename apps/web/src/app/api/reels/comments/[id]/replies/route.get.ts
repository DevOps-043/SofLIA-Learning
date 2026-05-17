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

    // Obtener respuestas del comentario con información del usuario
    const { data: replies, error } = await supabase
      .from('reel_comment_replies')
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
      .eq('comment_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching replies:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Verificar que el JOIN con users está funcionando correctamente
    if (replies && replies.length > 0) {
      logger.log(`📊 Respuestas obtenidas: ${replies.length}`)
      replies.forEach((reply, index: number) => {
        if (reply.users) {
          logger.log(`  ${index + 1}. Usuario: ${reply.users.username || reply.users.id} (${reply.users.id})`)
        } else {
          logger.warn(`  ⚠️ Respuesta ${reply.id} sin información de usuario`)
        }
      })
    }

    return NextResponse.json(replies || [])
  } catch (error) {
    logger.error('Error in GET /api/reels/comments/[id]/replies:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
