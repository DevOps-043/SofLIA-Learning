'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { useCourseIntroVideos } from '@/features/courses/hooks/useCourseIntroVideos'
import { useMobilePerformanceMode } from '@/lib/utils/mobile-performance'

export function useCourseLearnShellState(logic: LearnPageLogicResult) {
  const { disableHeavyEffects, interfaceTransitionMs } = useMobilePerformanceMode()
  const courseTitle = logic.course?.title || logic.course?.course_title || ''
  const intro = useCourseIntroVideos({
    courseSlug: logic.slug,
    organizationId: logic.course?.organization_id ?? null,
    enabled: logic.ready && Boolean(logic.course),
  })

  const handleValidationClose = () => {
    const lessonIdToShow = logic.validationModal.lessonId
    const redirectTab = logic.validationModal.redirectTab || (logic.validationModal.type === 'video' ? 'video' : 'activities')
    logic.setValidationModal((previous) => ({ ...previous, isOpen: false }))
    if (lessonIdToShow) logic.openLessonById(lessonIdToShow, { tab: redirectTab, trackOpen: false })
  }

  return {
    ...intro,
    courseTitle,
    currentLessonContext: logic.currentLesson ? logic.getLessonContext() : undefined,
    disableHeavyEffects,
    handleValidationClose,
    interfaceTransitionMs,
  }
}

export type CourseLearnShellState = ReturnType<typeof useCourseLearnShellState>
