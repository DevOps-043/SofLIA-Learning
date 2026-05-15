import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  isTranscodingEnabled,
  triggerTranscodingBackground,
} from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'
export const maxDuration = 60

const BodySchema = z.object({
  bucket: z.string().min(1).max(64).default('course-videos'),
  folder: z.string().max(200).default('videos'),
  /** Max number of BG functions to invoke immediately.  The rest stay
   *  queued and must be drained manually with /drain.  Defaults to 3 to
   *  stay well under Netlify's concurrency limits. */
  concurrency: z.number().int().min(1).max(10).default(3),
})

interface StorageObject {
  name: string
  metadata: { size?: number; mimetype?: string } | null
}

const MP4_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v']

function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase()
  return MP4_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function guessContentType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.mov') || lower.endsWith('.m4v')) return 'video/quicktime'
  return 'video/mp4'
}

/**
 * Enumerates the source video bucket folder, identifies videos that don't
 * yet have a completed (or in-flight) transcoding job, and queues HLS
 * generation for each.  Returns counts + the first N invoked jobIds so the
 * admin UI can show progress in real time.
 *
 * Concurrency protection: only `concurrency` BG functions are kicked off
 * eagerly.  Remaining rows stay `status: 'queued'` in the table and can be
 * picked up later (drain endpoint can re-trigger them).
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

  const parsed = BodySchema.safeParse(
    await request.json().catch(() => ({})),
  )
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      },
      { status: 400 },
    )
  }

  const { bucket, folder, concurrency } = parsed.data

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: 'Configuración del servidor incompleta' },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. List all video objects in the folder (paginated to handle >1000).
  const all: StorageObject[] = []
  let offset = 0
  const pageSize = 100
  while (true) {
    const { data: page, error: listError } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: pageSize, offset })
    if (listError) {
      return NextResponse.json(
        { success: false, error: `No se pudo listar el bucket: ${listError.message}` },
        { status: 500 },
      )
    }
    if (!page || page.length === 0) break
    for (const entry of page) {
      if (isVideoFile(entry.name)) {
        all.push({ name: entry.name, metadata: (entry.metadata ?? null) as StorageObject['metadata'] })
      }
    }
    if (page.length < pageSize) break
    offset += pageSize
  }

  if (all.length === 0) {
    return NextResponse.json({
      success: true,
      totalFound: 0,
      alreadyDone: 0,
      queued: 0,
      invoked: 0,
      jobIds: [],
    })
  }

  // 2. Build sourcePath list and check existing job rows in one query.
  const sourcePaths = all.map((entry) => `${folder}/${entry.name}`)

  const { data: existing, error: existingError } = await supabase
    .from('video_transcoding_jobs')
    .select('source_path, status')
    .eq('bucket', bucket)
    .in('source_path', sourcePaths)

  if (existingError) {
    return NextResponse.json(
      { success: false, error: `No se pudo consultar jobs existentes: ${existingError.message}` },
      { status: 500 },
    )
  }

  // Skip when there's already a completed or in-flight job.  Re-queue on
  // failed / skipped / disabled.
  const skipSet = new Set(
    (existing ?? [])
      .filter((row) =>
        row.status === 'completed' ||
        row.status === 'processing' ||
        row.status === 'queued',
      )
      .map((row) => row.source_path),
  )

  const pending = all.filter((entry) => !skipSet.has(`${folder}/${entry.name}`))

  if (pending.length === 0) {
    return NextResponse.json({
      success: true,
      totalFound: all.length,
      alreadyDone: skipSet.size,
      queued: 0,
      invoked: 0,
      jobIds: [],
    })
  }

  // 3. Insert all queued rows in one shot.
  const rowsToInsert = pending.map((entry) => {
    const sourcePath = `${folder}/${entry.name}`
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(sourcePath)
    return {
      source_path: sourcePath,
      source_url: urlData?.publicUrl ?? '',
      bucket,
      content_type:
        (entry.metadata?.mimetype as string | undefined) ??
        guessContentType(entry.name),
      size_bytes: entry.metadata?.size ?? null,
      status: 'queued' as const,
    }
  })

  const { data: insertedRows, error: insertError } = await supabase
    .from('video_transcoding_jobs')
    .insert(rowsToInsert)
    .select('id, source_path, source_url, bucket, content_type, size_bytes')

  if (insertError || !insertedRows) {
    return NextResponse.json(
      { success: false, error: `No se pudieron encolar los jobs: ${insertError?.message}` },
      { status: 500 },
    )
  }

  // 4. Trigger the first N BG functions (concurrency-limited).
  // Run all invocations in parallel — each fetch awaits the 202 response
  // which is fast (~100-500ms).  Promise.all lets the slowest one bound
  // the whole step instead of summing them sequentially.
  const toInvoke = insertedRows.slice(0, concurrency)
  const dispatchResults = await Promise.all(
    toInvoke.map((row) =>
      triggerTranscodingBackground({
        jobId: row.id,
        sourcePath: row.source_path,
        sourceUrl: row.source_url,
        bucket: row.bucket,
        contentType: row.content_type,
        sizeBytes: row.size_bytes,
      }),
    ),
  )
  const invokedCount = dispatchResults.filter((result) => result.ok).length
  const failures = dispatchResults.filter((result) => !result.ok)

  return NextResponse.json({
    success: true,
    totalFound: all.length,
    alreadyDone: skipSet.size,
    queued: insertedRows.length,
    invoked: invokedCount,
    jobIds: insertedRows.map((row) => row.id),
    failures,
  })
}
