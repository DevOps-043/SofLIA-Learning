'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LearnLesson, LearnTab } from '../../components/learn/types'

interface LearnVideoPlayerContext {
  saveVideoProgress: (lessonId: string, time: number) => void
  setIsPiPActive: (active: boolean) => void
  setShouldAutoPlay: (autoPlay: boolean) => void
}

interface UseLearnPageLayoutParams {
  currentLesson: LearnLesson | null
  videoPlayerContext: LearnVideoPlayerContext | null
}

export function useLearnPageLayout({
  currentLesson,
  videoPlayerContext,
}: UseLearnPageLayoutParams) {
  const [activeTab, setActiveTab] = useState<LearnTab>('video')
  const [isMobile, setIsMobile] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(
    null,
  )

  const handleTabChange = useCallback(
    async (newTab: LearnTab) => {
      if (activeTab === 'video' && newTab !== 'video') {
        const videoElement = document.querySelector(
          '.aspect-video video',
        ) as HTMLVideoElement | null

        if (videoElement) {
          const isVideoCurrentlyPlaying = !videoElement.paused
          const isPiPAlreadyActive = !!document.pictureInPictureElement
          const isPiPSupported =
            document.pictureInPictureEnabled &&
            'requestPictureInPicture' in videoElement

          if (isVideoCurrentlyPlaying && !isPiPAlreadyActive && isPiPSupported) {
            try {
              await videoElement.requestPictureInPicture()
              videoPlayerContext?.setIsPiPActive(true)
            } catch {}
          }
        }
      }

      if (newTab === 'video' && activeTab !== 'video') {
        if (document.pictureInPictureElement) {
          const pipVideo = document.pictureInPictureElement as HTMLVideoElement
          const currentTime = pipVideo.currentTime
          const wasPlaying = !pipVideo.paused

          if (currentLesson && videoPlayerContext) {
            videoPlayerContext.saveVideoProgress(
              currentLesson.lesson_id,
              currentTime,
            )
          }

          pipVideo.pause()

          try {
            await document.exitPictureInPicture()
            videoPlayerContext?.setIsPiPActive(false)
          } catch {}

          if (wasPlaying) {
            videoPlayerContext?.setShouldAutoPlay(true)
          }

          setActiveTab(newTab)

          if (wasPlaying) {
            setTimeout(() => {
              const mainVideo = document.querySelector(
                '.aspect-video video',
              ) as HTMLVideoElement | null

              if (mainVideo && mainVideo.paused) {
                mainVideo.currentTime = currentTime
                mainVideo.play().catch(() => {})
                videoPlayerContext?.setShouldAutoPlay(false)
              }
            }, 500)
          }

          return
        }
      }

      setActiveTab(newTab)
    },
    [activeTab, currentLesson, videoPlayerContext],
  )

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setScreenHeight(window.innerHeight)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setVisualViewportHeight(null)
      return
    }

    if (typeof window !== 'undefined' && window.visualViewport) {
      const updateViewportHeight = () => {
        setVisualViewportHeight(window.visualViewport?.height || null)
      }

      updateViewportHeight()
      window.visualViewport.addEventListener('resize', updateViewportHeight)
      window.visualViewport.addEventListener('scroll', updateViewportHeight)

      return () => {
        window.visualViewport?.removeEventListener(
          'resize',
          updateViewportHeight,
        )
        window.visualViewport?.removeEventListener(
          'scroll',
          updateViewportHeight,
        )
      }
    }

    const handleResize = () => {
      setVisualViewportHeight(window.innerHeight)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  const getInputAreaPadding = useCallback((): string => {
    if (!isMobile) {
      return '1rem'
    }

    if (screenHeight < 600) {
      return 'calc(0.75rem + max(env(safe-area-inset-bottom, 0px), 4px))'
    }

    return 'calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))'
  }, [isMobile, screenHeight])

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    isMobile,
    screenHeight,
    visualViewportHeight,
    getInputAreaPadding,
  }
}
