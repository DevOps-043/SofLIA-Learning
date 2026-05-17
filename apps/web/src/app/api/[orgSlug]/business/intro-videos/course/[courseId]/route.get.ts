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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('organization_course_intro_videos')
      .select('intro_video_url')
      .eq('organization_id', auth.organizationId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) {
      logger.error('GET course intro-video error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true, introVideoUrl: data?.intro_video_url ?? null })
  } catch (error) {
    logger.error('GET course intro-video error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
