import { REPORTS_ANALYTICS_UNSPECIFIED, isAnyDateWithinPeriod } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function shouldIncludeEngagementRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  // Allow course-less engagement (e.g. general SofLIA chat). Reject only when
  // a specific course is set and it doesn't belong to this org.
  if (
    context.orgCourseIds.size > 0 &&
    courseId &&
    courseId !== REPORTS_ANALYTICS_UNSPECIFIED &&
    !context.orgCourseIds.has(courseId)
  ) {
    return false
  }
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateWithinPeriod(dates, context.filters)
}
