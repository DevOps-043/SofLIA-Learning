import type { StudyApproach } from '../../types/planner-ui.types';
import type { StudyPlannerAnalyzeCalendarAndSuggestParams } from './study-planner-calendar-actions.types';

interface ResolveStudyPlannerEffectiveTargetDateParams {
  approachParam?: StudyApproach | null;
  assignedCourses: StudyPlannerAnalyzeCalendarAndSuggestParams['assignedCourses'];
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  targetDateParam?: string;
}

export function resolveStudyPlannerEffectiveTargetDate({
  approachParam,
  assignedCourses,
  studyApproach,
  targetDate,
  targetDateParam,
}: ResolveStudyPlannerEffectiveTargetDateParams): {
  effectiveApproach: StudyApproach | null;
  effectiveTargetDate: string | null;
} {
  const effectiveApproach =
    approachParam !== undefined ? approachParam : studyApproach;
  let effectiveTargetDate = targetDateParam || targetDate;

  if (!effectiveTargetDate) {
    const nearestAssignedCourse = assignedCourses.find((course) => course.dueDate);
    if (nearestAssignedCourse?.dueDate) {
      effectiveTargetDate = new Date(nearestAssignedCourse.dueDate).toLocaleDateString(
        'es-ES',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      );
    }
  }

  if (!effectiveTargetDate && effectiveApproach) {
    const weeksToAdd =
      effectiveApproach === 'corto'
        ? 2
        : effectiveApproach === 'balance'
          ? 4
          : 8;
    const fallbackTargetDate = new Date();
    fallbackTargetDate.setDate(fallbackTargetDate.getDate() + weeksToAdd * 7);
    effectiveTargetDate = fallbackTargetDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return {
    effectiveApproach,
    effectiveTargetDate,
  };
}
