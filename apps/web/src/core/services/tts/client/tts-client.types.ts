import type { MutableRefObject } from 'react'

export type AudioRef = MutableRefObject<HTMLAudioElement | null>

export interface PlayAudioBlobOptions {
  volume?: number
  /** Called after audio.play() confirms that playback has actually started. */
  onStart?: () => void
  onFinish?: () => void
  /** Called repeatedly while audio plays. progress is 0–1 (currentTime / duration). */
  onProgress?: (progress: number) => void
}
