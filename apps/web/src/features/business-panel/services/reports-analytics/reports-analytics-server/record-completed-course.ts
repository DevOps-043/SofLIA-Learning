import { buildPeriodKey, incrementMap, isAnyDateWithinPeriod } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'
import type { MutableCourseStats } from './mutable-course-stats'
import type { MutableUserStats } from './mutable-user-stats'

export function recordCompletedCourse(
  context: BuildContext,
  user: MutableUserStats,
  course: MutableCourseStats,
  userId: string,
  courseId: string,
  trendDate: string | null | undefined,
): void {
  user.completedCourseIds.add(courseId)
  course.completedUsers.add(userId)

  if (user.completedTrendCourseIds.has(courseId) || !trendDate) return
  user.completedTrendCourseIds.add(courseId)

  if (isAnyDateWithinPeriod([trendDate], context.filters)) {
    incrementMap(context.completionTrendCounts, buildPeriodKey(trendDate, context.filters.granularity))
  }
}
