import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { logger } from '@/lib/utils/logger'
import {
  removeInvalidIntroVideo,
  resolveOwnedIntroVideoReference,
  validateOwnedIntroVideoUpload,
} from '@/lib/media/server/intro-video-upload-validation.server'
import {
  introVideoUrlSchema,
  type IntroVideoUrlBody,
} from '../../../_schemas'

interface RouteParams {
  params: Promise<{ orgSlug: string; lpId: string }>
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function handlePut(
  _request: NextRequest,
  body: IntroVideoUrlBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Organizacion no encontrada', 403)
    }

    const reference = resolveOwnedIntroVideoReference({
      folder: 'lp',
      organizationSlug: orgSlug,
      publicUrl: body.videoUrl,
    })
    const validatedUpload = await validateOwnedIntroVideoUpload({
      folder: 'lp',
      organizationSlug: orgSlug,
      publicUrl: body.videoUrl,
    }).catch(() => null)
    if (!validatedUpload) {
      await removeInvalidIntroVideo(reference?.storagePath ?? null)
      return apiError('INVALID_INTRO_VIDEO', 'El video subido no es valido', 400)
    }

    const supabase = getServiceClient()

    const { error: upsertError } = await supabase
      .from('organization_lp_intro_videos')
      .upsert(
        {
          organization_id: auth.organizationId,
          learning_path_id: lpId,
          intro_video_url: body.videoUrl,
        },
        { onConflict: 'organization_id,learning_path_id' },
      )

    if (upsertError) {
      logger.error('PUT LP intro-video upsert error:', upsertError)
      return apiError('SAVE_INTRO_VIDEO_FAILED', 'Error al guardar el video', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PUT LP intro-video error:', error)
    return apiError('SAVE_INTRO_VIDEO_FAILED', 'Error interno', 500)
  }
}

export const PUT = withZodBody(introVideoUrlSchema, handlePut)
