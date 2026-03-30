import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateReelData } from '@/features/admin/services/adminReels.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateReelSchema } from '@/lib/schemas/content.schema'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    
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
      .single()

    if (error) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    return NextResponse.json(reel)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const bodyRaw = await request.json()
    const body = UpdateReelSchema.parse(bodyRaw)

    const updateData: any = {}
    
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
    
    updateData.updated_at = new Date().toISOString()

    const { data: updatedReel, error } = await supabase
      .from('reels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update reel' }, { status: 500 })
    }

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
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('reels')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
