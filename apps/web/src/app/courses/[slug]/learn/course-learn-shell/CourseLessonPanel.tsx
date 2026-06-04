'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { EmptyCourseContent } from './EmptyCourseContent'
import { LessonLoadingState } from './LessonLoadingState'
import { LessonTabContent } from './LessonTabContent'
import { LessonTabsBar } from './LessonTabsBar'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLessonPanel({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <div data-tour-id="course-learn--lesson-panel" className={`mx-0 my-0 flex flex-1 flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white md:mx-2 md:my-2 dark:border-white/5 dark:bg-carbon-900 ${shell.disableHeavyEffects ? '' : 'backdrop-blur-sm shadow-xl'}` }>
      {logic.modules.length === 0 ? <EmptyCourseContent /> : logic.currentLesson ? <><LessonTabsBar logic={logic} /><LessonTabContent logic={logic} shell={shell} /></> : <LessonLoadingState logic={logic} />}
    </div>
  )
}
