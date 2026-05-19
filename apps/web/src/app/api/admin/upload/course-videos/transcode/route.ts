import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { dispatchTranscodingJob } from '@/lib/media/server/transcoding-dispatcher.server'

import {
  transcodeVideoSchema,
  type TranscodeVideoBody,
} from './schema'

export const runtime = 'nodejs'
export const maxDuration = 60

async function handlePost(
  _request: NextRequest,
  body: TranscodeVideoBody,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return apiError(
      'SERVER_MISCONFIGURED',
      'Configuración del servidor incompleta',
      500,
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const result = await dispatchTranscodingJob({
      supabase,
      bucket: 'course-videos',
      contentType: body.contentType,
      sourceUrl: body.publicUrl,
      sizeBytes: body.size,
      sourcePath: body.sourcePath,
    })

    return NextResponse.json({
      success: true,
      jobId: result.jobId ?? null,
      transcoding: result.status,
      path: result.playbackPath,
      url: result.playbackUrl,
    })
  } catch {
    return apiError('TRANSCODE_FAILED', 'Error al procesar el video', 500)
  }
}

export const POST = withZodBody(transcodeVideoSchema, handlePost)
