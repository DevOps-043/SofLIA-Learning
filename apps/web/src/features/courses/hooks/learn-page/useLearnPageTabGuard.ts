import { useCallback } from 'react'

import { isLessonVideoCompleted } from '../lessonNavigation.utils'
import type { LearnLesson, LearnTab } from '../../components/learn/types'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLessonCompletion } from '../useLessonCompletion'
import type { useUserBehaviorLog } from '../useUserBehaviorLog'

interface UseLearnPageTabGuardParams {
  behavior: ReturnType<typeof useUserBehaviorLog>
  currentLesson: LearnLesson | null
  layout: ReturnType<typeof useLearnPageLayout>
  validation: ReturnType<typeof useLessonCompletion>
}

export function useLearnPageTabGuard({
  behavior,
  currentLesson,
  layout,
  validation,
}: UseLearnPageTabGuardParams) {
  return useCallback(
    async (newTab: LearnTab) => {
      if (
        newTab === 'activities' &&
        currentLesson &&
        !isLessonVideoCompleted(currentLesson)
      ) {
        behavior.trackUserAction('attempted_activities_access_before_video_completed', {
          lessonId: currentLesson.lesson_id,
          lessonTitle: currentLesson.lesson_title,
        })
        validation.openValidationModal({
          title: 'Finaliza el video para continuar',
          message:
            'Por favor, finaliza el video antes de continuar con las actividades.',
          type: 'video',
          lessonId: currentLesson.lesson_id,
          redirectTab: 'video',
        })
        return
      }

      await layout.handleTabChange(newTab)
    },
    [behavior, currentLesson, layout, validation],
  )
}
