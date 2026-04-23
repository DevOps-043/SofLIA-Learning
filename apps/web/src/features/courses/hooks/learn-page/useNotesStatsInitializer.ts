import { useEffect } from 'react'

import type { LearnModule } from '../../components/learn/types'

interface UseNotesStatsInitializerParams {
  initializeNotesStats: () => void
  modules: LearnModule[]
  notesStatsLessonsWithNotes: string
}

export function useNotesStatsInitializer({
  initializeNotesStats,
  modules,
  notesStatsLessonsWithNotes,
}: UseNotesStatsInitializerParams) {
  useEffect(() => {
    if (modules.length > 0 && notesStatsLessonsWithNotes === '0/0') {
      initializeNotesStats()
    }
  }, [initializeNotesStats, modules.length, notesStatsLessonsWithNotes])
}
