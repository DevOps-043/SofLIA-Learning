'use client'

import { CourseLearnSidebar } from './CourseLearnSidebar'
import { CourseLessonPanel } from './CourseLessonPanel'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnBody({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <div ref={logic.swipeRef} className="relative z-10 flex flex-1 flex-col overflow-hidden bg-white md:flex-row dark:bg-gray-900" style={{ marginRight: logic.isLiaOpen && !logic.isMobile ? '420px' : 0, transition: shell.disableHeavyEffects ? 'none' : 'margin-right 0.3s ease-in-out' }}>
      <CourseLearnSidebar logic={logic} />
      <CourseLessonPanel logic={logic} shell={shell} />
    </div>
  )
}
