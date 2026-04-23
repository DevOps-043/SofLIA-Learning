import { useCallback } from 'react'

import { buildLearnLessonContext } from './learn-page.service'
import type { useLearnPageBase } from './useLearnPageBase'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLearnPagePrompts } from './useLearnPagePrompts'
import type { useLearnPageState } from './useLearnPageState'
import type { useLessonSidebarState } from '../useLessonSidebarState'
import type { useNotesManagement } from '../useNotesManagement'

interface UseLearnPageLessonContextParams {
  base: ReturnType<typeof useLearnPageBase>
  layout: ReturnType<typeof useLearnPageLayout>
  notes: ReturnType<typeof useNotesManagement>
  prompts: ReturnType<typeof useLearnPagePrompts>
  sidebar: ReturnType<typeof useLessonSidebarState>
  state: ReturnType<typeof useLearnPageState>
}

export function useLearnPageLessonContext({
  base,
  layout,
  notes,
  prompts,
  sidebar,
  state,
}: UseLearnPageLessonContextParams) {
  const getLessonContext = useCallback(() => {
    const currentActivities = state.currentLesson
      ? sidebar.lessonsActivities[state.currentLesson.lesson_id]
      : undefined
    const currentMaterials = state.currentLesson
      ? sidebar.lessonsMaterials[state.currentLesson.lesson_id]
      : undefined
    const currentQuizStatus = state.currentLesson
      ? sidebar.lessonsQuizStatus[state.currentLesson.lesson_id]
      : undefined

    return buildLearnLessonContext({
      course: state.course,
      currentLesson: state.currentLesson,
      modules: state.modules,
      workshopMetadata: state.workshopMetadata,
      slug: base.slug,
      userJobTitle: base.user?.job_title || undefined,
      transcriptContent: state.liaTranscript,
      summaryContent: state.liaSummary,
      activeTab: layout.activeTab,
      currentPage:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      currentActivities,
      currentMaterials,
      quizStatus: currentQuizStatus,
      currentActivityPrompts: prompts.currentActivityPrompts,
    })
  }, [base, layout.activeTab, prompts.currentActivityPrompts, sidebar, state])

  const handleSaveLiaNote = useCallback(
    (content: string) => {
      notes.openLiaNoteModal(content)
    },
    [notes],
  )

  return {
    getLessonContext,
    handleSaveLiaNote,
  }
}
