import { isAnyDateWithinPeriod } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function shouldIncludeEngagementRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateWithinPeriod(dates, context.filters)
}
