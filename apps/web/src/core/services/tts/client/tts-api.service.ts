import type { TextToSpeechRequestPayload } from '../types'
import { TTS_API_PATH } from '../shared'

// 502 = Gemini upstream error (transient). Retry once with small backoff.
// 503 = provider not configured at all — do NOT retry, return null.
// Other 4xx/5xx = unrecoverable, throw.
const RETRYABLE_STATUS = new Set([502, 504])
const FALLBACK_STATUS = new Set([502, 503, 504])
const RETRY_DELAY_MS = 500

async function fetchOnce(
  payload: TextToSpeechRequestPayload,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(TTS_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(payload),
    signal,
  })
}

export async function requestTTSAudio(
  payload: TextToSpeechRequestPayload,
  signal?: AbortSignal,
): Promise<Blob | null> {
  let response = await fetchOnce(payload, signal)

  // Transient Gemini error → retry once
  if (RETRYABLE_STATUS.has(response.status)) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    response = await fetchOnce(payload, signal)
  }

  if (response.status === 204 || FALLBACK_STATUS.has(response.status) || response.status >= 500) {
    return null
  }

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  return response.blob()
}
