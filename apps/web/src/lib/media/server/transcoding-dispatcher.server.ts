import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

interface DispatchInput {
  supabase: SupabaseClient
  sourcePath: string
  sourceUrl: string
  bucket: string
  contentType: string
  sizeBytes?: number
}

interface DispatchResult {
  /** 'queued' when the BG function was triggered, 'disabled' when transcoding is off */
  status: 'queued' | 'disabled'
  jobId?: string
  /** Playback URL — initially the original source URL; updated once transcoding completes */
  playbackUrl: string
  playbackPath: string
}

function isTranscodingEnabled(): boolean {
  return process.env.VIDEO_TRANSCODING_ENABLED?.toLowerCase() === 'true'
}

/**
 * Creates a `video_transcoding_jobs` row and fires the Netlify Background
 * Function asynchronously.  Returns immediately with the job ID so the caller
 * can surface a "processing" state to the admin UI.
 *
 * When transcoding is disabled, returns a passthrough result pointing at the
 * original source URL — the video is playable as a plain MP4/WebM.
 */
export async function dispatchTranscodingJob(input: DispatchInput): Promise<DispatchResult> {
  const { supabase, sourcePath, sourceUrl, bucket, contentType, sizeBytes } = input

  if (!isTranscodingEnabled()) {
    return { status: 'disabled', playbackUrl: sourceUrl, playbackPath: sourcePath }
  }

  // 1. Insert job record — service-role key bypasses RLS
  const { data: job, error: insertError } = await supabase
    .from('video_transcoding_jobs')
    .insert({ source_path: sourcePath, source_url: sourceUrl, bucket, content_type: contentType, size_bytes: sizeBytes ?? null, status: 'queued' })
    .select('id')
    .single()

  if (insertError || !job) {
    // Non-fatal: log and fall back to passthrough so the upload still succeeds
    console.error('[transcoding-dispatcher] Failed to create job record:', insertError)
    return { status: 'disabled', playbackUrl: sourceUrl, playbackPath: sourcePath }
  }

  const jobId: string = job.id

  // 2. Fire background function — non-blocking, do not await
  const netlifyUrl = process.env.NETLIFY_URL ?? process.env.URL
  const secret = process.env.TRANSCODING_INTERNAL_SECRET

  if (!netlifyUrl || !secret) {
    console.warn('[transcoding-dispatcher] NETLIFY_URL or TRANSCODING_INTERNAL_SECRET not set — job queued but not dispatched')
    return { status: 'queued', jobId, playbackUrl: sourceUrl, playbackPath: sourcePath }
  }

  const bgFunctionUrl = `${netlifyUrl.replace(/\/$/, '')}/.netlify/functions/transcode-video-background`

  // Fire and forget — any network error is caught silently; the job stays
  // in 'queued' state and can be manually retried later.
  fetch(bgFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ jobId, sourcePath, sourceUrl, bucket, contentType, sizeBytes }),
  }).catch((err: unknown) => {
    console.error('[transcoding-dispatcher] Failed to trigger background function:', err)
  })

  return { status: 'queued', jobId, playbackUrl: sourceUrl, playbackPath: sourcePath }
}
