import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { resolveHlsUrlForSource } from '@/lib/media/server/hls-source-resolver.server'

import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string; lpId: string }>
}

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Devuelve el video introductorio del LP para esta org y si el usuario ya lo vio */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Sin organización' }, { status: 403 })
    }

    const supabase = db()

    const [videoResult, progressResult] = await Promise.all([
      supabase
        .from('organization_lp_intro_videos')
        .select('intro_video_url')
        .eq('organization_id', auth.organizationId)
        .eq('learning_path_id', lpId)
        .maybeSingle(),

      supabase
        .from('user_learning_path_progress')
        .select('lp_intro_watched_at')
        .eq('user_id', auth.userId)
        .eq('learning_path_id', lpId)
        .maybeSingle(),
    ])

    // Sirve el master.m3u8 cuando el video del LP ya fue transcodificado a
    // HLS, habilitando la seleccion de resolucion. Fallback al MP4 original.
    const introVideoUrl = await resolveHlsUrlForSource(
      supabase,
      videoResult.data?.intro_video_url,
    )

    return NextResponse.json({
      success: true,
      introVideoUrl,
      watched: Boolean(progressResult.data?.lp_intro_watched_at),
    })
  } catch (error) {
    logger.error('GET LP intro-video (business-user) error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
