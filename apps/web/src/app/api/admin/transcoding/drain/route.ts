import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  isTranscodingEnabled,
  triggerTranscodingBackground,
} from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'

const BodySchema = z.object({
  /** Max BG functions to invoke in this drain call.  Defaults to 5 to
   *  match scan-and-queue's default. */
  concurrency: z.number().int().min(1).max(10).default(5),
})

/**
 * Picks the oldest `queued` jobs (FIFO) and fires BG functions for them.
 * Called from the admin dashboard when the user wants to keep the pipeline
 * moving after the initial scan-and-queue invocation.
 *
 * This is the manual-drain counterpart to the automatic concurrency cap
 * built into scan-and-queue.  Safer than letting scan-and-queue fan out
 * 50 BG functions at once (Netlify throttles and Supabase Storage egress
 * spikes can hurt).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isTranscodingEnabled()) {
    return NextResponse.json(
      { success: false, error: 'Transcoding está desactivado.' },
      { status: 409 },
    )
  }

  const parsed = BodySchema.safeParse(
    await request.json().catch(() => ({})),
  )
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos' },
      { status: 400 },
    )
  }

  const { concurrency } = parsed.data

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: 'Configuración del servidor incompleta' },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // How many slots are free?  We assume `processing` jobs are taking up
  // concurrency slots and only fire enough new ones to fill what's left.
  const { count: processingCount } = await supabase
    .from('video_transcoding_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'processing')

  const slotsFree = Math.max(0, concurrency - (processingCount ?? 0))
  if (slotsFree === 0) {
    return NextResponse.json({
      success: true,
      invoked: 0,
      message: 'No hay slots libres — los jobs en processing ya ocupan la cuota.',
    })
  }

  const { data: queuedRows, error: queryError } = await supabase
    .from('video_transcoding_jobs')
    .select('id, source_path, source_url, bucket, content_type, size_bytes')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(slotsFree)

  if (queryError) {
    return NextResponse.json(
      { success: false, error: queryError.message },
      { status: 500 },
    )
  }

  if (!queuedRows || queuedRows.length === 0) {
    return NextResponse.json({
      success: true,
      invoked: 0,
      message: 'No hay jobs en cola.',
    })
  }

  const dispatchResults = await Promise.all(
    queuedRows.map((row) =>
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

  const successes = dispatchResults.filter((result) => result.ok)
  const failures = dispatchResults.filter((result) => !result.ok)

  return NextResponse.json({
    success: true,
    invoked: successes.length,
    jobIds: successes.map((result) => result.jobId),
    failures,
  })
}
