import { isCompletedStatus } from './is-completed-status'

export function resolveCourseStatus(
  assignmentStatus: string | null | undefined,
  enrollmentStatus: string | null | undefined,
  progress: number,
): string {
  if (progress >= 100 || isCompletedStatus(assignmentStatus) || isCompletedStatus(enrollmentStatus)) {
    return 'completed'
  }

  if (progress > 0 || enrollmentStatus === 'active' || assignmentStatus === 'in_progress') {
    return 'in_progress'
  }

  return 'assigned'
}
