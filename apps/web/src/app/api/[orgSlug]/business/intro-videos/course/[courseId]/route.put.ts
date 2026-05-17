import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { logger } from '@/lib/utils/logger'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface RouteParams {
  params: Promise<{ orgSlug: string; courseId: string }>
}

const PutSchema = z.object({
  videoUrl: z.string().url('URL de video inválida'),
})

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

    const supabase = getServiceClient()

    // No validamos la existencia del curso — el FK constraint en la tabla
    // lo garantiza. Validar aquí causaba 404 si el table name o UUID difería.
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
      logger.error('PUT course intro-video upsert error:', upsertError)
      return NextResponse.json({ success: false, error: 'Error al guardar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT course intro-video error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
