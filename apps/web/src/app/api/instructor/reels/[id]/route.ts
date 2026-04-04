import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { UpdateReelSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/instructor/reels/[id]
 * Obtiene un reel específico del instructor actual
 */
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

    logger.log('🔄 Obteniendo reel del instructor con ID:', id)

    const { data: reel, error } = await supabase
      .from('reels')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration_seconds,
        category,
        language,
        is_featured,
        is_active,
        view_count,
        like_count,
        share_count,
        comment_count,
        created_by,
        created_at,
        updated_at,
        published_at
      `)
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Solo si pertenece al instructor
      .single()

    if (error || !reel) {
      logger.error('❌ Error fetching instructor reel:', error)
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    logger.log('✅ Reel del instructor obtenido exitosamente:', reel)
    return NextResponse.json(reel)
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/instructor/reels/[id]
 * Actualiza un reel del instructor actual
 */
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
    
    // ✅ SEGURIDAD: Verificar que el reel pertenece al instructor
    const { data: existingReel, error: checkError } = await supabase
      .from('reels')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (checkError || !existingReel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    if (existingReel.created_by !== instructorId) {
      logger.warn('Instructor attempted to update reel they did not create', {
        instructorId,
        reelId: id,
        reelOwner: existingReel.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este reel' },
        { status: 403 }
      )
    }
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const bodyRaw = await request.json()
    const body = UpdateReelSchema.parse(bodyRaw)
    
    logger.log('🔄 Actualizando reel del instructor:', id)

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.video_url !== undefined) updateData.video_url = body.video_url
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url
    if (body.duration_seconds !== undefined) updateData.duration_seconds = body.duration_seconds
    if (body.category !== undefined) updateData.category = body.category
    if (body.language !== undefined) updateData.language = body.language
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.published_at !== undefined) updateData.published_at = body.published_at

    const { data: updatedReel, error } = await supabase
      .from('reels')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad
      .select()
      .single()

    if (error) {
      logger.error('❌ Error updating instructor reel:', error)
      return NextResponse.json(
        { error: 'Failed to update reel' },
        { status: 500 }
      )
    }

    logger.log('✅ Reel del instructor actualizado exitosamente:', updatedReel)
    return NextResponse.json(updatedReel)
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

/**
 * DELETE /api/instructor/reels/[id]
 * Elimina un reel del instructor actual
 */
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

    // ✅ SEGURIDAD: Verificar que el reel pertenece al instructor
    const { data: existingReel, error: checkError } = await supabase
      .from('reels')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (checkError || !existingReel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    if (existingReel.created_by !== instructorId) {
      logger.warn('Instructor attempted to delete reel they did not create', {
        instructorId,
        reelId: id,
        reelOwner: existingReel.created_by
      })
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este reel' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('reels')
      .delete()
      .eq('id', id)
      .eq('created_by', instructorId) // ✅ Doble verificación de seguridad

    if (error) {
      logger.error('❌ Error deleting instructor reel:', error)
      return NextResponse.json(
        { error: 'Failed to delete reel' },
        { status: 500 }
      )
    }

    logger.log('✅ Reel del instructor eliminado exitosamente')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

