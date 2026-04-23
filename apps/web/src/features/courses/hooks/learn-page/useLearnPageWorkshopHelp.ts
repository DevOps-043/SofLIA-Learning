import { useCallback } from 'react'

import type { DifficultyAnalysis } from '../../../../lib/rrweb/difficulty-pattern-detector'
import {
  buildWorkshopEnrichedLessonContext,
  buildWorkshopHelpMessage,
} from '../../services/learn-workshop-assistant.service'
import type { useLearnPageBase } from './useLearnPageBase'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLearnPageLessonContext } from './useLearnPageLessonContext'
import type { useLearnPageState } from './useLearnPageState'
import type { useLessonSidebarState } from '../useLessonSidebarState'
import type { useUserBehaviorLog } from '../useUserBehaviorLog'

interface UseLearnPageWorkshopHelpParams {
  base: ReturnType<typeof useLearnPageBase>
  behavior: ReturnType<typeof useUserBehaviorLog>
  layout: ReturnType<typeof useLearnPageLayout>
  lessonContext: ReturnType<typeof useLearnPageLessonContext>
  sidebar: ReturnType<typeof useLessonSidebarState>
  state: ReturnType<typeof useLearnPageState>
}

export function useLearnPageWorkshopHelp({
  base,
  behavior,
  layout,
  lessonContext,
  sidebar,
  state,
}: UseLearnPageWorkshopHelpParams) {
  const handleWorkshopHelpAccepted = useCallback(
    async (analysis: DifficultyAnalysis) => {
      base.openLia()

      const visibleUserMessage = buildWorkshopHelpMessage(analysis)
      const currentActivities = state.currentLesson
        ? sidebar.lessonsActivities[state.currentLesson.lesson_id] || []
        : []
      const enrichedLessonContext = buildWorkshopEnrichedLessonContext({
        lessonContext: lessonContext.getLessonContext(),
        analysis,
        behaviorAnalysis: behavior.analyzeUserBehavior(),
        currentActivities,
        activeTab: layout.activeTab,
        currentLesson: state.currentLesson,
        modules: state.modules,
        userJobTitle: base.user?.job_title || undefined,
      })

      if (state.workshopMetadata && enrichedLessonContext?.contextType === 'workshop') {
        await base.sendLiaMessage(visibleUserMessage, undefined, enrichedLessonContext, true)
        return
      }

      await base.sendLiaMessage(visibleUserMessage, enrichedLessonContext, undefined, true)
    },
    [base, behavior, layout.activeTab, lessonContext, sidebar.lessonsActivities, state],
  )

  return {
    handleWorkshopHelpAccepted,
  }
}
