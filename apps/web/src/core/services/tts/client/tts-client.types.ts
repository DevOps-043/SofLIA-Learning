import type { MutableRefObject } from 'react'

export type AudioRef = MutableRefObject<HTMLAudioElement | null>

export interface PlayAudioBlobOptions {
  volume?: number
  onFinish?: () => void
}
