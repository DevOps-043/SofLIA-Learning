import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string; lpId: string }>
}

const PutSchema = z.object({
  videoUrl: z.string().url('URL de video inválida'),
})

// Service role client — bypasa el RLS de learning_paths que bloquearía
// la escritura cuando el LP no tiene asignación org-level en assignments.
// La autorización ya se validó con requireBusiness antes de usarlo.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
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

    const supabase = getServiceClient()

    const { error: upsertError } = await supabase
      .from('organization_lp_intro_videos')
      .upsert(
        {
          organization_id: auth.organizationId,
          learning_path_id: lpId,
          intro_video_url: parsed.data.videoUrl,
        },
        { onConflict: 'organization_id,learning_path_id' },
      )

    if (upsertError) {
      logger.error('PUT LP intro-video upsert error:', upsertError)
      return NextResponse.json({ success: false, error: 'Error al guardar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT LP intro-video error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
