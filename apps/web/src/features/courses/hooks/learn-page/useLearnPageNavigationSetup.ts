import { useLessonNavigation } from '../useLessonNavigation'
import type { useLearnPageBase } from './useLearnPageBase'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLearnPageOrderedLessons } from './useLearnPageOrderedLessons'
import type { useLearnPageState } from './useLearnPageState'
import type { useLessonCompletion } from '../useLessonCompletion'
import type { useLessonSidebarState } from '../useLessonSidebarState'
import type { useUserBehaviorLog } from '../useUserBehaviorLog'

interface UseLearnPageNavigationSetupParams {
  base: ReturnType<typeof useLearnPageBase>
  behavior: ReturnType<typeof useUserBehaviorLog>
  layout: ReturnType<typeof useLearnPageLayout>
  ordered: ReturnType<typeof useLearnPageOrderedLessons>
  sidebar: ReturnType<typeof useLessonSidebarState>
  state: ReturnType<typeof useLearnPageState>
  validation: ReturnType<typeof useLessonCompletion>
}

export function useLearnPageNavigationSetup({
  base,
  behavior,
  layout,
  ordered,
  sidebar,
  state,
  validation,
}: UseLearnPageNavigationSetupParams) {
  return useLessonNavigation({
    orderedLessons: ordered.orderedLessons,
    modules: state.modules,
    currentLesson: state.currentLesson,
    lessonsActivities: sidebar.lessonsActivities,
    lessonsMaterials: sidebar.lessonsMaterials,
    setCurrentLesson: state.setCurrentLesson,
    setActiveTab: layout.setActiveTab,
    markLessonAsCompleted: validation.markLessonAsCompleted,
    loadLessonActivitiesAndMaterials: sidebar.loadLessonActivitiesAndMaterials,
    openValidationModal: validation.openValidationModal,
    trackUserAction: behavior.trackUserAction,
    videoPlayerContext: base.videoPlayerContext,
  })
}
