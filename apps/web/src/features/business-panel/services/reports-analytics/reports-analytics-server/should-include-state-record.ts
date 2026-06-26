import { isAnyDateOnOrBefore } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function shouldIncludeStateRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  // Reject records for courses that don't belong to this org.
  // orgCourseIds is populated by applyAssignments (which runs first) so it is
  // already complete by the time enrollments and lesson progress are applied.
  if (context.orgCourseIds.size > 0 && courseId && !context.orgCourseIds.has(courseId)) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateOnOrBefore(dates, context.filters.to)
}
