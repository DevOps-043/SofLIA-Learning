'use client'

import { useCallback, useState } from 'react'
import type { LearnLesson, LearnTab } from '../../components/learn/types'
import type { LearnVideoPlayerContext } from './learn-page-layout.types'
import {
  enterVideoPictureInPicture,
  restorePictureInPictureToMainVideo,
  saveCurrentVideoProgress,
} from './learn-page-video-pip'
import { useLearnViewportMetrics } from './useLearnViewportMetrics'

interface UseLearnPageLayoutParams {
  currentLesson: LearnLesson | null
  videoPlayerContext: LearnVideoPlayerContext | null
}

export function useLearnPageLayout({
  currentLesson,
  videoPlayerContext,
}: UseLearnPageLayoutParams) {
  const [activeTab, setActiveTab] = useState<LearnTab>('video')
  const viewportMetrics = useLearnViewportMetrics()

  const handleTabChange = useCallback(
    async (newTab: LearnTab) => {
      if (
        activeTab === 'video' &&
        newTab !== 'video' &&
        currentLesson
      ) {
        saveCurrentVideoProgress(currentLesson, videoPlayerContext)
      }

      if (activeTab === 'video' && newTab !== 'video') {
        await enterVideoPictureInPicture(videoPlayerContext)
      }

      if (newTab === 'video' && activeTab !== 'video') {
        const handled = await restorePictureInPictureToMainVideo({
          currentLesson,
          setActiveTab,
          videoPlayerContext,
        })

        if (handled) {
          return
        }
      }

      setActiveTab(newTab)
    },
    [activeTab, currentLesson, videoPlayerContext],
  )

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    ...viewportMetrics,
  }
}
