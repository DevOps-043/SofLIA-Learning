import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateNewsSchema } from '@/lib/schemas/content.schema'
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
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'News not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ news })
  } catch (error) {
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
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params
    
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

    // Parsear campos JSON
    const parseJsonField = (field: any) => {
      if (field === undefined || field === null || field === '') return null
      if (typeof field !== 'string') return field // Si ya es un objeto/array, devolverlo tal como está
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    const updateData: Record<string, any> = {
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
    if (body.created_by !== undefined) updateData.created_by = body.created_by
    if (body.tldr !== undefined) updateData.tldr = parseJsonField(body.tldr)
    if (body.links !== undefined) updateData.links = parseJsonField(body.links)
    if (body.cta !== undefined) updateData.cta = parseJsonField(body.cta)
    if (body.metrics !== undefined) updateData.metrics = parseJsonField(body.metrics)

    // @ts-ignore - Supabase types are too strict for dynamic updates
    const { data: updatedNews, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update news' },
        { status: 500 }
      )
    }

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
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete news' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
