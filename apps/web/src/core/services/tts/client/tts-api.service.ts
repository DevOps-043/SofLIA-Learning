import type { TextToSpeechRequestPayload } from '../types'
import { TTS_API_PATH } from '../shared'

export async function requestTTSAudio(
  payload: TextToSpeechRequestPayload,
  signal?: AbortSignal,
): Promise<Blob | null> {
  const response = await fetch(TTS_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (response.status === 503) {
    return null
  }

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  return response.blob()
}
