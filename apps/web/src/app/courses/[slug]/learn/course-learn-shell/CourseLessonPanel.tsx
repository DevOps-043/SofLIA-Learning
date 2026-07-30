'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { EmptyCourseContent } from './EmptyCourseContent'
import { LessonLoadingState } from './LessonLoadingState'
import { LessonTabContent } from './LessonTabContent'
import { LessonTabsBar } from './LessonTabsBar'
import type { CourseLearnShellState } from './useCourseLearnShellState'
import styles from './CourseLessonPanel.module.css'

export function CourseLessonPanel({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <div
      data-tour-id="course-learn--lesson-panel"
      className={`${styles.lessonPanel} ${
        shell.disableHeavyEffects ? styles.lessonPanelLite : ''
      }`}
    >
      {logic.modules.length === 0 ? <EmptyCourseContent /> : logic.currentLesson ? <><LessonTabsBar logic={logic} /><LessonTabContent logic={logic} shell={shell} /></> : <LessonLoadingState logic={logic} />}
    </div>
  )
}
