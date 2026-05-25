import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { logger } from '@/lib/utils/logger'
import {
  introVideoUrlSchema,
  type IntroVideoUrlBody,
} from '../../../_schemas'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface RouteParams {
  params: Promise<{ orgSlug: string; courseId: string }>
}

async function handlePut(
  _request: NextRequest,
  body: IntroVideoUrlBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Organizacion no encontrada', 403)
    }

    const supabase = getServiceClient()

    const { error: upsertError } = await supabase
      .from('organization_course_intro_videos')
      .upsert(
        {
          organization_id: auth.organizationId,
          course_id: courseId,
          intro_video_url: body.videoUrl,
        },
        { onConflict: 'organization_id,course_id' },
      )

    if (upsertError) {
      logger.error('PUT course intro-video upsert error:', upsertError)
      return apiError('SAVE_INTRO_VIDEO_FAILED', 'Error al guardar el video', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT course intro-video error:', error)
    return apiError('SAVE_INTRO_VIDEO_FAILED', 'Error interno', 500)
  }
}

export const PUT = withZodBody(introVideoUrlSchema, handlePut)
