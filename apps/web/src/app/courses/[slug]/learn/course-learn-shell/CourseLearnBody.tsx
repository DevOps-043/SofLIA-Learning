'use client'

import { CourseLearnSidebar } from './CourseLearnSidebar'
import { CourseLessonPanel } from './CourseLessonPanel'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import type { StyleConfig } from '@/features/business-panel/contexts/OrganizationStylesContext'
import type { CourseLearnShellState } from './useCourseLearnShellState'

interface CourseLearnBodyProps {
  logic: LearnPageLogicResult;
  shell: CourseLearnShellState;
  panelStyles?: StyleConfig | null;
}

export function CourseLearnBody({ logic, shell, panelStyles }: CourseLearnBodyProps) {
  return (
    <div
      ref={logic.swipeRef}
      className="relative z-10 flex flex-1 flex-col overflow-hidden md:flex-row"
      style={{
        background: 'var(--learn-body-bg)',
        marginRight: logic.isLiaOpen && !logic.isMobile ? '428px' : 0,
        transition: shell.disableHeavyEffects ? 'none' : 'margin-right 0.3s ease-in-out',
      }}
    >
      <CourseLearnSidebar logic={logic} panelStyles={panelStyles} />
      <CourseLessonPanel logic={logic} shell={shell} />
    </div>
  )
}
