import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  isTranscodingEnabled,
  triggerTranscodingBackground,
} from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z
  .object({
    concurrency: z.number().int().min(1).max(10).default(5),
    dryRun: z.boolean().default(false),
  })
  .strict()

type Body = z.infer<typeof schema>

const LEGACY_URL_MARKER = '/storage/v1/object/public/production-videos/'
const OUTPUT_BUCKET = 'course-videos'

function extractFilenameFromLegacyUrl(url: string): string | null {
  const idx = url.indexOf(LEGACY_URL_MARKER)
  if (idx === -1) return null
  const after = decodeURIComponent(url.slice(idx + LEGACY_URL_MARKER.length))
  const lastSlash = after.lastIndexOf('/')
  return lastSlash >= 0 ? after.slice(lastSlash + 1) : after
}

function guessContentType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.mov') || lower.endsWith('.m4v')) return 'video/quicktime'
  return 'video/mp4'
}

async function handlePost(_request: NextRequest, body: Body) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isTranscodingEnabled()) {
    return apiError('TRANSCODING_DISABLED', 'Transcoding esta desactivado.', 409)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return apiError('SERVER_CONFIGURATION_INCOMPLETE', 'Configuracion del servidor incompleta.', 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // 1. Fetch all custom lessons that reference the legacy production-videos bucket
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, video_provider_id')
    .eq('video_provider', 'custom')
    .ilike('video_provider_id', `%${LEGACY_URL_MARKER}%`)

  if (lessonsError) {
    return apiError('QUERY_FAILED', 'No se pudieron consultar las lecciones.', 500)
  }

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ success: true, totalFound: 0, alreadyDone: 0, queued: 0, invoked: 0, jobIds: [] })
  }

  // 2. Deduplicate by source URL
  const uniqueUrls = Array.from(
    new Set(
      (lessons as Array<{ lesson_id: string; video_provider_id: string }>)
        .map((l) => l.video_provider_id)
        .filter((url) => url && url.includes(LEGACY_URL_MARKER)),
    ),
  )

  // 3. Check which URLs already have a completed/queued/processing job
  const { data: existingJobs } = await supabase
    .from('video_transcoding_jobs')
    .select('source_url, status')
    .in('source_url', uniqueUrls)

  const skipSet = new Set(
    (existingJobs ?? [])
      .filter((row) => row.status === 'completed' || row.status === 'processing' || row.status === 'queued')
      .map((row) => row.source_url as string),
  )

  const pendingUrls = uniqueUrls.filter((url) => !skipSet.has(url))

  if (body.dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalFound: uniqueUrls.length,
      alreadyDone: skipSet.size,
      pendingCount: pendingUrls.length,
      pendingSample: pendingUrls.slice(0, 5),
    })
  }

  if (pendingUrls.length === 0) {
    return NextResponse.json({
      success: true,
      totalFound: uniqueUrls.length,
      alreadyDone: skipSet.size,
      queued: 0,
      invoked: 0,
      jobIds: [],
    })
  }

  // 4. Build job rows — source_path uses 'legacy/<filename>' so HLS output
  //    lands at course-videos/legacy/hls/<assetId>/master.m3u8
  const rowsToInsert = pendingUrls.map((sourceUrl) => {
    const filename = extractFilenameFromLegacyUrl(sourceUrl) ?? `video-${Date.now()}.mp4`
    return {
      bucket: OUTPUT_BUCKET,
      content_type: guessContentType(filename),
      size_bytes: null,
      source_path: `legacy/${filename}`,
      source_url: sourceUrl,
      status: 'queued' as const,
    }
  })

  const { data: insertedRows, error: insertError } = await supabase
    .from('video_transcoding_jobs')
    .insert(rowsToInsert)
    .select('id, source_path, source_url, bucket, content_type, size_bytes')

  if (insertError || !insertedRows) {
    return apiError('TRANSCODING_JOBS_QUEUE_FAILED', 'No se pudieron encolar los jobs.', 500)
  }

  // 5. Trigger up to `concurrency` background functions immediately
  const toInvoke = insertedRows.slice(0, body.concurrency)
  const dispatchResults = await Promise.all(
    toInvoke.map((row) =>
      triggerTranscodingBackground({
        bucket: row.bucket,
        contentType: row.content_type,
        jobId: row.id,
        sizeBytes: row.size_bytes ?? undefined,
        sourcePath: row.source_path,
        sourceUrl: row.source_url,
      }),
    ),
  )

  const invokedCount = dispatchResults.filter((r) => r.ok).length
  const failures = dispatchResults.filter((r) => !r.ok)

  return NextResponse.json({
    success: true,
    totalFound: uniqueUrls.length,
    alreadyDone: skipSet.size,
    queued: insertedRows.length,
    invoked: invokedCount,
    jobIds: insertedRows.map((r) => r.id),
    failures,
  })
}

export const POST = withZodBody(schema, handlePost, { emptyBodyFallback: {} })
