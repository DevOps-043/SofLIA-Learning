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

interface TriggerBackgroundInput {
  jobId: string
  sourcePath: string
  sourceUrl: string
  bucket: string
  contentType: string
  sizeBytes?: number | null
}

export function isTranscodingEnabled(): boolean {
  return process.env.VIDEO_TRANSCODING_ENABLED?.toLowerCase() === 'true'
}

/**
 * Fire the background function for an already-existing job row.  Used by the
 * bulk reprocess flow which inserts queued rows first and then drips
 * background invocations to control concurrency.  Returns true when the
 * BG function call was attempted, false when env vars are missing.
 */
export function triggerTranscodingBackground(input: TriggerBackgroundInput): boolean {
  const netlifyUrl = process.env.NETLIFY_URL ?? process.env.URL
  const secret = process.env.TRANSCODING_INTERNAL_SECRET
  if (!netlifyUrl || !secret) {
    console.warn('[transcoding-dispatcher] NETLIFY_URL or TRANSCODING_INTERNAL_SECRET not set')
    return false
  }
  const bgFunctionUrl = `${netlifyUrl.replace(/\/$/, '')}/.netlify/functions/transcode-video-background`
  fetch(bgFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      jobId: input.jobId,
      sourcePath: input.sourcePath,
      sourceUrl: input.sourceUrl,
      bucket: input.bucket,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes ?? undefined,
    }),
  }).catch((err: unknown) => {
    console.error('[transcoding-dispatcher] Failed to trigger background function:', err)
  })
  return true
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

  triggerTranscodingBackground({
    jobId,
    sourcePath,
    sourceUrl,
    bucket,
    contentType,
    sizeBytes: sizeBytes ?? null,
  })

  return { status: 'queued', jobId, playbackUrl: sourceUrl, playbackPath: sourcePath }
}
