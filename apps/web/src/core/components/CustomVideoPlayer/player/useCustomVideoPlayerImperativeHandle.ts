import {
  type ForwardedRef,
  useImperativeHandle,
} from 'react'
import type { CustomVideoPlayerRef } from './types'

interface ImperativeHandleParams {
  ref: ForwardedRef<CustomVideoPlayerRef>
  isPiP: boolean
  isPlaying: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  setIsPiP: (v: boolean) => void
  onPiPChange?: (active: boolean) => void
}

export function useCustomVideoPlayerImperativeHandle({
  ref,
  isPiP,
  isPlaying,
  videoRef,
  setIsPiP,
  onPiPChange,
}: ImperativeHandleParams) {
  useImperativeHandle(
    ref,
    () => ({
      exitPiP: async () => {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
          setIsPiP(false)
          onPiPChange?.(false)
        }
      },
      getVideoElement: () => videoRef.current,
      isPiPActive: () => isPiP,
      isPlaying: () => isPlaying,
      requestPiP: async () => {
        const videoElement = videoRef.current
        if (!videoElement || document.pictureInPictureElement) return
        await videoElement.requestPictureInPicture()
        setIsPiP(true)
        onPiPChange?.(true)
      },
    }),
    [isPiP, isPlaying, onPiPChange]
  )
}
