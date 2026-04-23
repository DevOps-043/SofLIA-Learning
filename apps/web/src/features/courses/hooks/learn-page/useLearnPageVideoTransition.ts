import { useEffect } from 'react'

import { hasIncompleteActivities } from '../lessonNavigation.utils'
import type { LearnLesson } from '../../components/learn/types'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLessonNavigation } from '../useLessonNavigation'
import type { useLessonSidebarState } from '../useLessonSidebarState'
import type { useLearnPageVideoCompletion } from './useLearnPageVideoCompletion'

interface UseLearnPageVideoTransitionParams {
  currentLesson: LearnLesson | null
  layout: ReturnType<typeof useLearnPageLayout>
  navigation: ReturnType<typeof useLessonNavigation>
  sidebar: ReturnType<typeof useLessonSidebarState>
  videoCompletion: ReturnType<typeof useLearnPageVideoCompletion>
}

export function useLearnPageVideoTransition({
  currentLesson,
  layout,
  navigation,
  sidebar,
  videoCompletion,
}: UseLearnPageVideoTransitionParams) {
  const pendingLessonId = videoCompletion.pendingVideoTransitionLessonId

  useEffect(() => {
    if (!pendingLessonId || !currentLesson?.lesson_id) {
      return
    }

    if (pendingLessonId !== currentLesson.lesson_id || layout.activeTab !== 'video') {
      videoCompletion.setPendingVideoTransitionLessonId(null)
      return
    }

    const activitiesList = sidebar.lessonsActivities[pendingLessonId]

    if (activitiesList === undefined) {
      return
    }

    videoCompletion.setPendingVideoTransitionLessonId(null)

    if (hasIncompleteActivities(activitiesList)) {
      layout.setActiveTab('activities')
      return
    }

    void navigation.navigateToNextLesson()
  }, [
    currentLesson?.lesson_id,
    layout,
    navigation,
    pendingLessonId,
    sidebar.lessonsActivities,
    videoCompletion,
  ])
}
