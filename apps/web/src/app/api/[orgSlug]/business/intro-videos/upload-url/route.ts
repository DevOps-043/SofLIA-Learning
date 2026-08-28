import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  INTRO_VIDEO_MAX_SIZE_BYTES,
  isStreamableVideoExtension,
} from '@/lib/media/video-upload-policy'
import { logger } from '@/lib/utils/logger'
import {
  introVideoUploadUrlSchema,
  type IntroVideoUploadUrlBody,
} from '../../_schemas'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

const BUCKET = 'intro-videos'

/**
 * Genera una signed upload URL para subir un video introductorio directamente
 * desde el browser al bucket de Supabase.
 */
async function handlePost(
  _request: NextRequest,
  body: IntroVideoUploadUrlBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'Organizacion no encontrada', 403)
    }

    const { fileName, fileSize, folder } = body
    const safeOrgSlug = orgSlug.trim().toLowerCase()
    if (!/^[a-z0-9-]{3,80}$/.test(safeOrgSlug)) {
      return apiError('INVALID_ORGANIZATION_SLUG', 'Organizacion invalida', 400)
    }

    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (!isStreamableVideoExtension(ext)) {
      return apiError('INVALID_VIDEO_EXTENSION', `Extension no permitida: .${ext}`, 400)
    }

    if (fileSize && fileSize > INTRO_VIDEO_MAX_SIZE_BYTES) {
      return apiError(
        'INTRO_VIDEO_TOO_LARGE',
        `El video introductorio es demasiado grande. Maximo ${Math.round(INTRO_VIDEO_MAX_SIZE_BYTES / 1024 / 1024)}MB`,
        400,
      )
    }

    const safeFolder = folder || 'lp'
    const storagePath = `org/${safeOrgSlug}/${safeFolder}/${crypto.randomUUID()}.${ext}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createServiceClient(supabaseUrl, serviceKey)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      logger.error('Error creating signed upload URL:', error)
      return apiError('CREATE_UPLOAD_URL_FAILED', 'No se pudo generar la URL de subida', 500)
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      publicUrl: urlData.publicUrl,
    })
  } catch (error) {
    logger.error('POST upload-url error:', error)
    return apiError('CREATE_UPLOAD_URL_FAILED', 'Error interno', 500)
  }
}

export const POST = withZodBody(introVideoUploadUrlSchema, handlePost)
