import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  STREAMABLE_VIDEO_MIME_TYPES,
} from '@/lib/media/video-upload-policy'
import {
  dispatchTranscodingJob,
  isTranscodingEnabled,
} from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  sourcePath: z.string().min(1).max(600),
  bucket: z.string().min(1).max(64).default('course-videos'),
  contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES).default('video/mp4'),
})

/**
 * Re-runs HLS transcoding for an existing source video.  Useful for two
 * cases:
 *   1) A legacy MP4 that was uploaded before VIDEO_TRANSCODING_ENABLED was
 *      turned on, so no HLS variants exist yet.
 *   2) A previously-completed job that needs to be re-generated (e.g.
 *      after changing the rendition ladder).
 *
 * Returns the new jobId so the admin UI can poll status.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isTranscodingEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Transcoding está desactivado en producción (VIDEO_TRANSCODING_ENABLED).',
      },
      { status: 409 },
    )
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      },
      { status: 400 },
    )
  }

  const { sourcePath, bucket, contentType } = parsed.data

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: 'Configuración del servidor incompleta' },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Resolve the public URL — the BG function needs to download the source.
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(sourcePath)
  if (!urlData?.publicUrl) {
    return NextResponse.json(
      { success: false, error: 'No se pudo resolver la URL pública del video' },
      { status: 400 },
    )
  }

  // Try to read the actual file size — purely informational for the job row.
  let sizeBytes: number | undefined
  try {
    const folderPath = sourcePath.replace(/\/[^/]+$/, '')
    const fileName = sourcePath.split('/').pop()
    if (folderPath && fileName) {
      const { data: list } = await supabase.storage
        .from(bucket)
        .list(folderPath, { search: fileName, limit: 1 })
      const found = list?.find((entry) => entry.name === fileName)
      const meta = (found?.metadata ?? null) as { size?: number } | null
      if (typeof meta?.size === 'number') sizeBytes = meta.size
    }
  } catch {
    // ignore — sizeBytes is optional
  }

  const result = await dispatchTranscodingJob({
    supabase,
    bucket,
    contentType,
    sourcePath,
    sourceUrl: urlData.publicUrl,
    sizeBytes,
  })

  return NextResponse.json({
    success: true,
    jobId: result.jobId ?? null,
    status: result.status,
    sourcePath,
    sourceUrl: urlData.publicUrl,
  })
}
