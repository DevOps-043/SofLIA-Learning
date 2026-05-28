import { DEFAULT_TTS_VOLUME } from '../shared'
import type {
  AudioRef,
  PlayAudioBlobOptions,
} from './tts-client.types'

export async function playAudioBlob(
  blob: Blob,
  audioRef: AudioRef,
  options: PlayAudioBlobOptions = {},
): Promise<void> {
  const volume = options.volume ?? DEFAULT_TTS_VOLUME
  const audioUrl = URL.createObjectURL(blob)
  const audio = new Audio(audioUrl)
  audio.volume = volume
  audioRef.current = audio

  const cleanup = () => {
    URL.revokeObjectURL(audioUrl)
    if (audioRef.current === audio) {
      audioRef.current = null
    }
  }

  audio.onended = () => {
    cleanup()
    options.onFinish?.()
  }

  audio.onerror = () => {
    cleanup()
    options.onFinish?.()
  }

  if (options.onProgress) {
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        options.onProgress!(audio.currentTime / audio.duration)
      }
    }
  }

  try {
    await audio.play()
  } catch (error) {
    cleanup()
    throw error
  }
}
