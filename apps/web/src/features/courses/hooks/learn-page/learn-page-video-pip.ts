import type { Dispatch, SetStateAction } from 'react'

import type { LearnLesson, LearnTab } from '../../components/learn/types'
import type { LearnVideoPlayerContext } from './learn-page-layout.types'

const VIDEO_SELECTOR = '.aspect-video video'
const PIP_RESTORE_DELAY_MS = 500

function getMainVideoElement(): HTMLVideoElement | null {
  return document.querySelector(VIDEO_SELECTOR) as HTMLVideoElement | null
}

export function saveCurrentVideoProgress(
  currentLesson: LearnLesson | null,
  videoPlayerContext: LearnVideoPlayerContext | null,
) {
  const currentVideoElement = getMainVideoElement()

  if (!currentLesson || !videoPlayerContext || !currentVideoElement) {
    return
  }

  videoPlayerContext.saveVideoProgress(currentLesson.lesson_id, currentVideoElement.currentTime)
}

export async function enterVideoPictureInPicture(
  videoPlayerContext: LearnVideoPlayerContext | null,
) {
  const videoElement = getMainVideoElement()

  if (!videoElement) return

  const isVideoCurrentlyPlaying = !videoElement.paused
  const isPiPAlreadyActive = Boolean(document.pictureInPictureElement)
  const isPiPSupported =
    document.pictureInPictureEnabled &&
    'requestPictureInPicture' in videoElement

  if (!isVideoCurrentlyPlaying || isPiPAlreadyActive || !isPiPSupported) return

  try {
    await videoElement.requestPictureInPicture()
    videoPlayerContext?.setIsPiPActive(true)
  } catch {}
}

interface RestorePiPParams {
  currentLesson: LearnLesson | null
  setActiveTab: Dispatch<SetStateAction<LearnTab>>
  videoPlayerContext: LearnVideoPlayerContext | null
}

export async function restorePictureInPictureToMainVideo({
  currentLesson,
  setActiveTab,
  videoPlayerContext,
}: RestorePiPParams) {
  if (!document.pictureInPictureElement) return false

  const pipVideo = document.pictureInPictureElement as HTMLVideoElement
  const currentTime = pipVideo.currentTime
  const wasPlaying = !pipVideo.paused

  if (currentLesson && videoPlayerContext) {
    videoPlayerContext.saveVideoProgress(currentLesson.lesson_id, currentTime)
  }

  pipVideo.pause()

  try {
    await document.exitPictureInPicture()
    videoPlayerContext?.setIsPiPActive(false)
  } catch {}

  if (wasPlaying) {
    videoPlayerContext?.setShouldAutoPlay(true)
  }

  setActiveTab('video')

  if (wasPlaying) {
    setTimeout(() => {
      const mainVideo = getMainVideoElement()
      if (mainVideo && mainVideo.paused) {
        mainVideo.currentTime = currentTime
        mainVideo.play().catch(() => {})
        videoPlayerContext?.setShouldAutoPlay(false)
      }
    }, PIP_RESTORE_DELAY_MS)
  }

  return true
}
