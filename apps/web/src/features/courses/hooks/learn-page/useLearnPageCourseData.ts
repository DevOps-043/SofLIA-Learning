'use client'

import type { UseLearnPageCourseDataParams } from './learn-data.types'
import { useCourseLearnDataEffect } from './useCourseLearnDataEffect'
import { useLessonAccessTracking } from './useLessonAccessTracking'
import { useLessonSupplements } from './useLessonSupplements'
import { useNotesStatsInitializer } from './useNotesStatsInitializer'

export function useLearnPageCourseData(params: UseLearnPageCourseDataParams) {
  useCourseLearnDataEffect(params)
  useNotesStatsInitializer({
    initializeNotesStats: params.initializeNotesStats,
    modules: params.modules,
    notesStatsLessonsWithNotes: params.notesStatsLessonsWithNotes,
  })
  useLessonSupplements(params)
  useLessonAccessTracking({
    currentLesson: params.currentLesson,
    organizationId: params.organizationId,
    slug: params.slug,
  })
}
