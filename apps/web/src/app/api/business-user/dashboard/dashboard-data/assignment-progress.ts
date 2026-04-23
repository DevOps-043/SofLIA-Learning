import type { CombinedAssignmentRow, EnrollmentRow } from './types'

export function getAssignmentProgress(
  assignment: CombinedAssignmentRow,
  enrollmentsMap: Map<string, EnrollmentRow>,
) {
  const enrollment = enrollmentsMap.get(assignment.course_id)
  if (
    enrollment?.overall_progress_percentage !== null &&
    enrollment?.overall_progress_percentage !== undefined
  ) {
    return Number(enrollment.overall_progress_percentage)
  }
  return assignment.completion_percentage ? Number(assignment.completion_percentage) : 0
}

// TODO(i18n): These status labels are returned as localized Spanish strings.
// The client should receive typed keys ('completed' | 'in_progress' | 'assigned')
// and handle translation — avoids re-doing this when adding EN/PT support.
export function getAssignmentStatus(
  assignment: CombinedAssignmentRow,
  enrollment: EnrollmentRow | undefined,
  progress: number,
) {
  if (
    progress >= 100 ||
    assignment.status === 'completed' ||
    enrollment?.enrollment_status === 'completed'
  ) {
    return 'Completado' as const
  }

  if (
    progress > 0 ||
    assignment.status === 'in_progress' ||
    enrollment?.enrollment_status === 'active'
  ) {
    return 'En progreso' as const
  }

  return 'Asignado' as const
}
