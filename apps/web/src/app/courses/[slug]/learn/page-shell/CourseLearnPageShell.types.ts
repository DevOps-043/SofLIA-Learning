import type { useCourseLearnJoyride } from '@/features/tours/hooks/useCourseLearnJoyride';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

export type CourseLearnTourState = ReturnType<typeof useCourseLearnJoyride>;

export interface CourseLearnShellChildProps {
  courseTour: CourseLearnTourState;
  disableHeavyEffects: boolean;
  logic: LearnPageLogicResult;
}
