import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string; courseId: string }>
}

const PutSchema = z.object({
  videoUrl: z.string().url('URL de video inválida'),
})

async function verifyCourseInOrgLearningPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  courseId: string,
): Promise<boolean> {
  // Valida que el curso pertenezca a algún LP asignado a esta org
  const { data, error } = await supabase
    .from('learning_path_items')
    .select('id, learning_path:learning_paths!inner(id)')
    .eq('course_id', courseId)
    .not('learning_path', 'is', null)
    .limit(1)

  if (error || !data?.length) return false

  const lpIds = data.map((item) => (item.learning_path as { id: string } | null)?.id).filter(Boolean) as string[]
  if (!lpIds.length) return false

  const { data: assignment } = await supabase
    .from('organization_learning_path_assignments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('learning_path_id', lpIds)
    .limit(1)
    .single()

  return Boolean(assignment)
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_course_intro_videos')
      .select('intro_video_url')
      .eq('organization_id', auth.organizationId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) {
      logger.error('GET intro-video course error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true, introVideoUrl: data?.intro_video_url ?? null })
  } catch (error) {
    logger.error('GET intro-video course error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, courseId } = await params
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

    const allowed = await verifyCourseInOrgLearningPaths(supabase, auth.organizationId, courseId)
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'El curso no pertenece a ninguna ruta asignada a esta organización' }, { status: 403 })
    }

    const { error: upsertError } = await supabase
      .from('organization_course_intro_videos')
      .upsert(
        {
          organization_id: auth.organizationId,
          course_id: courseId,
          intro_video_url: parsed.data.videoUrl,
        },
        { onConflict: 'organization_id,course_id' },
      )

    if (upsertError) {
      logger.error('PUT intro-video course upsert error:', upsertError)
      return NextResponse.json({ success: false, error: 'Error al guardar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT intro-video course error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_course_intro_videos')
      .delete()
      .eq('organization_id', auth.organizationId)
      .eq('course_id', courseId)

    if (error) {
      logger.error('DELETE intro-video course error:', error)
      return NextResponse.json({ success: false, error: 'Error al eliminar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('DELETE intro-video course error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
