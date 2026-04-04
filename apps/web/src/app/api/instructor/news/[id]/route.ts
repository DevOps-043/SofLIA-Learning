import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { UpdateNewsSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    const instructorId = auth.userId

    logger.log('🔄 Obteniendo noticia con ID:', id)

    const { data: news, error } = await supabase
      .from('news')
      .select(`
        id,
        title,
        slug,
        subtitle,
        intro,
        sections,
        hero_image_url,
        language,
        status,
        published_at,
        created_at,
        updated_at,
        created_by,
        tldr,
        metrics,
        links,
        cta
      `)
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Solo si pertenece al instructor
      .single()

    if (error || !news) {
      logger.error('❌ Error fetching instructor news:', error)
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    logger.log('✅ Noticia del instructor obtenida exitosamente:', news)
    return NextResponse.json({ news })
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    const instructorId = auth.userId
    
    // ✅ SEGURIDAD: Verificar que la noticia pertenece al instructor
    const { data: existingNews, error: checkError } = await supabase
      .from('news')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (checkError || !existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    if (existingNews.created_by !== instructorId) {
      logger.warn('Instructor attempted to update news they did not create', {
        instructorId,
        newsId: id,
        newsOwner: existingNews.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar esta noticia' },
        { status: 403 }
      )
    }
    
    // ✅ SEGURIDAD: Validar campos básicos con Zod
    const bodyRaw = await request.json()
    const basicValidation = UpdateNewsSchema.pick({
      title: true,
      content: true,
      category: true
    }).partial().parse({
      title: bodyRaw.title,
      content: bodyRaw.intro || bodyRaw.subtitle,
      category: bodyRaw.category
    })
    
    const body = bodyRaw
    logger.log('🔄 Actualizando noticia del instructor:', id)

    // Parsear campos JSON
    const parseJsonField = (field: unknown): unknown => {
      if (field === undefined || field === null || field === '') return null
      if (typeof field !== 'string') return field
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Solo actualizar campos que están presentes en el body
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle
    if (body.intro !== undefined) updateData.intro = body.intro
    if (body.sections !== undefined) updateData.sections = parseJsonField(body.sections)
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url
    if (body.language !== undefined) updateData.language = body.language
    if (body.status !== undefined) {
      updateData.status = body.status
      // Si se cambia a publicado y no tiene fecha de publicación, agregarla
      if (body.status === 'published' && !body.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (body.tldr !== undefined) updateData.tldr = parseJsonField(body.tldr)
    if (body.links !== undefined) updateData.links = parseJsonField(body.links)
    if (body.cta !== undefined) updateData.cta = parseJsonField(body.cta)
    if (body.metrics !== undefined) updateData.metrics = parseJsonField(body.metrics)

    // @ts-ignore - Supabase types are too strict for dynamic updates
    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad
      .select()
      .single()

    if (error) {
      logger.error('❌ Error updating instructor news:', error)
      return NextResponse.json(
        { error: 'Failed to update news' },
        { status: 500 }
      )
    }

    logger.log('✅ Noticia del instructor actualizada exitosamente:', updatedNews)
    return NextResponse.json({ news: updatedNews })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    const instructorId = auth.userId

    // ✅ SEGURIDAD: Verificar que la noticia pertenece al instructor
    const { data: existingNews, error: checkError } = await supabase
      .from('news')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (checkError || !existingNews) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    if (existingNews.created_by !== instructorId) {
      logger.warn('Instructor attempted to delete news they did not create', {
        instructorId,
        newsId: id,
        newsOwner: existingNews.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta noticia' },
        { status: 403 }
      )
    }

    logger.log('🔄 Eliminando noticia del instructor con ID:', id)

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad

    if (error) {
      logger.error('❌ Error deleting instructor news:', error)
      return NextResponse.json(
        { error: 'Failed to delete news' },
        { status: 500 }
      )
    }

    logger.log('✅ Noticia del instructor eliminada exitosamente')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
