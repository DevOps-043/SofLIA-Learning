import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id } = await params
    const supabase = await createClient()
    const instructorId = auth.userId
    const body = await request.json()
    const { status } = body

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft, published, or archived' },
        { status: 400 }
      )
    }

    // ✅ SEGURIDAD: Verificar que la noticia pertenece al instructor
    const { data: existingNews, error: checkError } = await supabase
      .from('news')
      .select('id, created_by, published_at')
      .eq('id', id)
      .single()

    if (checkError || !existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    if (existingNews.created_by !== instructorId) {
      logger.warn('Instructor attempted to change status of news they did not create', {
        instructorId,
        newsId: id,
        newsOwner: existingNews.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para cambiar el estado de esta noticia' },
        { status: 403 }
      )
    }

    logger.log('🔄 Cambiando estado de noticia del instructor con ID:', id, 'a:', status)

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    // Si se cambia a publicado y no tiene fecha de publicación, agregarla
    if (status === 'published' && !existingNews.published_at) {
      updateData.published_at = new Date().toISOString()
    }

    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad
      .select()
      .single()

    if (error) {
      logger.error('❌ Error updating instructor news status:', error)
      return NextResponse.json(
        { error: 'Failed to update news status' },
        { status: 500 }
      )
    }

    logger.log('✅ Estado de noticia del instructor actualizado exitosamente:', updatedNews)
    return NextResponse.json({ news: updatedNews })
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

