import { useLearnPageCourseData } from './useLearnPageCourseData'
import type { useLearnPageBase } from './useLearnPageBase'
import type { useLearnPageState } from './useLearnPageState'
import type { useNotesManagement } from '../useNotesManagement'

interface UseLearnPageDataLoaderParams {
  base: ReturnType<typeof useLearnPageBase>
  notes: ReturnType<typeof useNotesManagement>
  state: ReturnType<typeof useLearnPageState>
}

/**
 * Wires the top-level page context (base, state, notes) into `useLearnPageCourseData`,
 * which triggers the actual data fetch and populates `state.courseDataSetters`.
 *
 * This hook has no return value — it exists solely to bridge the param shapes
 * between `useLearnPageLogic` and `useLearnPageCourseData`.
 *
 * Side effects: triggers a data load on mount and whenever slug/lang/org change.
 */
export function useLearnPageDataLoader({
  base,
  notes,
  state,
}: UseLearnPageDataLoaderParams) {
  useLearnPageCourseData({
    slug: base.slug,
    selectedLang: base.selectedLang,
    organizationId: base.organizationId,
    userJobTitle: base.user?.job_title || undefined,
    currentLesson: state.currentLesson,
    modules: state.modules,
    notesStatsLessonsWithNotes: notes.notesStats.lessonsWithNotes,
    applyServerNotesStats: notes.applyServerNotesStats,
    initializeNotesStats: notes.initializeNotesStats,
    ...state.courseDataSetters,
  })
}
