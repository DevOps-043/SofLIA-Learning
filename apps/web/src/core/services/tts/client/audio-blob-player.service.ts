import { DEFAULT_TTS_VOLUME } from '../shared'
import { getSharedAudioElement } from './ios-audio-unlock'
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
  // Reutilizamos el ÚNICO elemento "bendecido" por el gesto del usuario para que
  // iOS/WebKit permita la reproducción tras el fetch de síntesis (fuera del gesto).
  // Crear un `new Audio()` por fragmento dejaría elementos no bendecidos que iOS
  // bloquea silenciosamente. Fallback a `new Audio()` solo por seguridad (SSR/tests).
  const audio = getSharedAudioElement() ?? new Audio()

  // El elemento es compartido: limpiamos handlers y reproducción previa antes de
  // cargar este blob para que no se filtren callbacks de una locución anterior.
  try { audio.pause() } catch { /* ignore */ }
  audio.onended = null
  audio.onerror = null
  audio.ontimeupdate = null

  audio.src = audioUrl
  audio.volume = volume
  audioRef.current = audio

  let finished = false
  const cleanup = () => {
    if (finished) return
    finished = true
    audio.onended = null
    audio.onerror = null
    audio.ontimeupdate = null
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
