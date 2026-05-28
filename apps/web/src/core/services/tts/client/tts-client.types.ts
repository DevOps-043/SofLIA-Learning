import type { MutableRefObject } from 'react'

export type AudioRef = MutableRefObject<HTMLAudioElement | null>

export interface PlayAudioBlobOptions {
  volume?: number
  onFinish?: () => void
  /** Called repeatedly while audio plays. progress is 0–1 (currentTime / duration). */
  onProgress?: (progress: number) => void
}
