'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { EmptyCourseContent } from './EmptyCourseContent'
import { LessonLoadingState } from './LessonLoadingState'
import { LessonTabContent } from './LessonTabContent'
import { LessonTabsBar } from './LessonTabsBar'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLessonPanel({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <div
      data-tour-id="course-learn--lesson-panel"
      className={`mx-0 my-0 flex flex-1 flex-col overflow-hidden rounded-lg border-2 md:mx-2 md:my-2${shell.disableHeavyEffects ? '' : ' backdrop-blur-sm shadow-xl'}`}
      style={{ background: 'var(--learn-card-bg)', borderColor: 'var(--learn-card-border)' }}
    >
      {logic.modules.length === 0 ? <EmptyCourseContent /> : logic.currentLesson ? <><LessonTabsBar logic={logic} /><LessonTabContent logic={logic} shell={shell} /></> : <LessonLoadingState logic={logic} />}
    </div>
  )
}
