import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string; lpId: string }>
}

const PutSchema = z.object({
  videoUrl: z.string().url('URL de video inválida'),
})

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_learning_path_assignments')
      .select('id, intro_video_url')
      .eq('organization_id', auth.organizationId)
      .eq('learning_path_id', lpId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Ruta no asignada a esta organización' }, { status: 404 })
    }

    return NextResponse.json({ success: true, introVideoUrl: data.intro_video_url ?? null })
  } catch (error) {
    logger.error('GET intro-video LP error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el LP esté asignado a esta org
    const { data: assignment, error: findError } = await supabase
      .from('organization_learning_path_assignments')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('learning_path_id', lpId)
      .eq('status', 'active')
      .single()

    if (findError || !assignment) {
      return NextResponse.json({ success: false, error: 'Ruta no asignada a esta organización' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('organization_learning_path_assignments')
      .update({ intro_video_url: parsed.data.videoUrl })
      .eq('id', assignment.id)

    if (updateError) {
      logger.error('PUT intro-video LP update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al guardar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT intro-video LP error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data: assignment, error: findError } = await supabase
      .from('organization_learning_path_assignments')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('learning_path_id', lpId)
      .eq('status', 'active')
      .single()

    if (findError || !assignment) {
      return NextResponse.json({ success: false, error: 'Ruta no asignada a esta organización' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('organization_learning_path_assignments')
      .update({ intro_video_url: null })
      .eq('id', assignment.id)

    if (updateError) {
      logger.error('DELETE intro-video LP error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al eliminar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('DELETE intro-video LP error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
