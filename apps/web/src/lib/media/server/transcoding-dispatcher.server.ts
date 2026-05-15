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

export interface TriggerResult {
  ok: boolean
  jobId: string
  /** Machine-readable failure code when ok=false. */
  reason?:
    | 'missing_url'
    | 'missing_secret'
    | 'network_error'
    | 'non_202_response'
  /** Human-readable detail (HTTP status code, error message, etc.). */
  detail?: string
}

/**
 * Fire the background function for an already-existing job row.
 *
 * IMPORTANT: We `await` the fetch.  Netlify Background Functions return
 * 202 immediately, so the await only costs the request round-trip
 * (~100-500ms), not the full transcoding time.  Without awaiting, the
 * promise gets cancelled when the Next.js serverless handler returns —
 * which is exactly why the BG function was never being invoked.
 */
export async function triggerTranscodingBackground(
  input: TriggerBackgroundInput,
): Promise<TriggerResult> {
  const netlifyUrl =
    process.env.NETLIFY_URL ?? process.env.URL ?? process.env.DEPLOY_URL
  if (!netlifyUrl) {
    console.warn('[transcoding-dispatcher] No site URL env var (NETLIFY_URL / URL / DEPLOY_URL)')
    return { ok: false, jobId: input.jobId, reason: 'missing_url' }
  }

  const secret = process.env.TRANSCODING_INTERNAL_SECRET
  if (!secret) {
    console.warn('[transcoding-dispatcher] TRANSCODING_INTERNAL_SECRET not configured')
    return { ok: false, jobId: input.jobId, reason: 'missing_secret' }
  }

  const bgFunctionUrl = `${netlifyUrl.replace(/\/$/, '')}/.netlify/functions/transcode-video-background`

  try {
    const response = await fetch(bgFunctionUrl, {
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
      // Reasonable bound — the BG function returns 202 in well under 5s
      // even on cold starts.
      signal: AbortSignal.timeout(15_000),
    })

    // Netlify BG functions always reply 202 Accepted on success.
    if (response.status !== 202) {
      const body = await response.text().catch(() => '')
      console.error(
        '[transcoding-dispatcher] BG function returned non-202:',
        response.status,
        body.slice(0, 500),
      )
      return {
        ok: false,
        jobId: input.jobId,
        reason: 'non_202_response',
        detail: `HTTP ${response.status} ${body.slice(0, 200)}`,
      }
    }

    return { ok: true, jobId: input.jobId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[transcoding-dispatcher] Fetch to BG function failed:', message)
    return {
      ok: false,
      jobId: input.jobId,
      reason: 'network_error',
      detail: message,
    }
  }
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

  await triggerTranscodingBackground({
    jobId,
    sourcePath,
    sourceUrl,
    bucket,
    contentType,
    sizeBytes: sizeBytes ?? null,
  })

  return { status: 'queued', jobId, playbackUrl: sourceUrl, playbackPath: sourcePath }
}
