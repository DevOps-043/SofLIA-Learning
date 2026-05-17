'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { CourseLearnLoadingState } from './course-learn-shell/CourseLearnLoadingState'
import { CourseLearnWorkspace } from './course-learn-shell/CourseLearnWorkspace'
import { CourseUnavailableState } from './course-learn-shell/CourseUnavailableState'
import { useCourseLearnShellState } from './course-learn-shell/useCourseLearnShellState'

interface CourseLearnPageShellProps {
  logic: LearnPageLogicResult
}

export function CourseLearnPageShell({ logic }: CourseLearnPageShellProps) {
  const shell = useCourseLearnShellState(logic)

  if (!logic.ready || logic.loading) {
    return <CourseLearnLoadingState logic={logic} />
  }

  if (!logic.course) {
    return <CourseUnavailableState logic={logic} />
  }

  return <CourseLearnWorkspace logic={logic} shell={shell} />
}
