import { useEffect, useRef } from 'react'

import {
  hasIncompleteActivities,
  isLessonVideoCompleted,
} from '../lessonNavigation.utils'
import type { LearnLesson } from '../../components/learn/types'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLessonSidebarState } from '../useLessonSidebarState'

interface UseLearnPageVideoAutoRedirectParams {
  currentLesson: LearnLesson | null
  layout: ReturnType<typeof useLearnPageLayout>
  sidebar: ReturnType<typeof useLessonSidebarState>
}

export function useLearnPageVideoAutoRedirect({
  currentLesson,
  layout,
  sidebar,
}: UseLearnPageVideoAutoRedirectParams) {
  const checkedAutoRedirectRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentLesson?.lesson_id) {
      return
    }

    const lessonId = currentLesson.lesson_id
    if (checkedAutoRedirectRef.current === lessonId) {
      return
    }

    const activitiesList = sidebar.lessonsActivities[lessonId]
    if (activitiesList === undefined) {
      return
    }

    checkedAutoRedirectRef.current = lessonId

    if (layout.activeTab !== 'video') {
      return
    }

    const hasPending =
      activitiesList.length > 0 && hasIncompleteActivities(activitiesList)

    if (isLessonVideoCompleted(currentLesson) && hasPending) {
      layout.setActiveTab('activities')
    }
  }, [
    currentLesson?.is_completed,
    currentLesson?.lesson_id,
    currentLesson?.progress_percentage,
    layout,
    sidebar.lessonsActivities,
  ])
}
