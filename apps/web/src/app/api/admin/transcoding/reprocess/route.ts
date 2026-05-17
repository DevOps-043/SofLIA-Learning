import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { STREAMABLE_VIDEO_MIME_TYPES } from '@/lib/media/video-upload-policy'
import {
  dispatchTranscodingJob,
  isTranscodingEnabled,
} from '@/lib/media/server/transcoding-dispatcher.server'
import {
  createTranscodingSupabaseClient,
  getPublicSourceUrl,
  readSourceSizeBytes,
} from './reprocess-transcoding.helpers'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  sourcePath: z.string().min(1).max(600),
  bucket: z.string().min(1).max(64).default('course-videos'),
  contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES).default('video/mp4'),
})

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isTranscodingEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Transcoding estÃ¡ desactivado en producciÃ³n (VIDEO_TRANSCODING_ENABLED).',
      },
      { status: 409 },
    )
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos invÃ¡lidos',
      },
      { status: 400 },
    )
  }

  const { sourcePath, bucket, contentType } = parsed.data
  const supabase = createTranscodingSupabaseClient()

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'ConfiguraciÃ³n del servidor incompleta' },
      { status: 500 },
    )
  }

  const publicSourceUrl = getPublicSourceUrl(supabase, bucket, sourcePath)

  if (!publicSourceUrl) {
    return NextResponse.json(
      { success: false, error: 'No se pudo resolver la URL pÃºblica del video' },
      { status: 400 },
    )
  }

  const sizeBytes = await readSourceSizeBytes(supabase, bucket, sourcePath)
  const result = await dispatchTranscodingJob({
    supabase,
    bucket,
    contentType,
    sourcePath,
    sourceUrl: publicSourceUrl,
    sizeBytes,
  })

  return NextResponse.json({
    success: true,
    jobId: result.jobId ?? null,
    status: result.status,
    sourcePath,
    sourceUrl: publicSourceUrl,
  })
}
