import type { BuildContext } from './build-context'

export interface ReportsAnalyticsAssignmentState {
  userId: string
  courseId: string
  progress: number
  completed: boolean
}

/**
 * Canonical user-course facts used by every assignment-based KPI.
 *
 * A person with three assigned courses contributes three observations. This
 * keeps progress, completion, and portfolio statuses on the same denominator.
 */
export function getAssignmentStates(context: BuildContext): ReportsAnalyticsAssignmentState[] {
  return Array.from(context.users.entries()).flatMap(([userId, stats]) =>
    Array.from(stats.assignedCourseIds).map((courseId) => ({
      userId,
      courseId,
      progress: stats.progressByCourse.get(courseId) ?? 0,
      completed: stats.completedCourseIds.has(courseId),
    })),
  )
}
