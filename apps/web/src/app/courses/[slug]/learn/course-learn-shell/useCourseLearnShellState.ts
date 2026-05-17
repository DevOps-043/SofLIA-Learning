'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { useCourseIntroVideos } from '@/features/courses/hooks/useCourseIntroVideos'
import { useCourseLearnJoyride } from '@/features/tours/hooks/useCourseLearnJoyride'
import { useMobilePerformanceMode } from '@/lib/utils/mobile-performance'
import { useVideoPlayerOptional } from '../VideoPlayerContext'

export function useCourseLearnShellState(logic: LearnPageLogicResult) {
  const videoPlayerContext = useVideoPlayerOptional()
  const { disableHeavyEffects, interfaceTransitionMs } = useMobilePerformanceMode()
  const courseTitle = logic.course?.title || logic.course?.course_title || ''
  const intro = useCourseIntroVideos({
    courseSlug: logic.slug,
    organizationId: logic.course?.organization_id ?? null,
    enabled: logic.ready && Boolean(logic.course),
  })
  const courseTour = useCourseLearnJoyride({
    courseSlug: logic.slug,
    courseTitle,
    lessonTitle: logic.currentLesson?.lesson_title,
    enabled: logic.ready && Boolean(logic.course) && !intro.showVideoIntro && !intro.isLoadingIntro,
    isMobile: logic.isMobile,
    closeLia: logic.closeLia,
    openLeftPanel: logic.openLeftPanel,
    closeLeftPanel: logic.closeLeftPanel,
    setActiveTab: logic.setActiveTab,
    pauseVideoPlayback: videoPlayerContext?.pauseAllVideos,
    clearPendingAutoPlay: videoPlayerContext ? () => videoPlayerContext.setShouldAutoPlay(false) : undefined,
    mobilePerformanceMode: disableHeavyEffects,
    restartWithIntroVideos: intro.restartWithIntroVideos,
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
    courseTour,
    currentLessonContext: logic.currentLesson ? logic.getLessonContext() : undefined,
    disableHeavyEffects,
    handleValidationClose,
    interfaceTransitionMs,
  }
}

export type CourseLearnShellState = ReturnType<typeof useCourseLearnShellState>
