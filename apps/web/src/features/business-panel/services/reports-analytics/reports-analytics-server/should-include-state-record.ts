import { isAnyDateOnOrBefore } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function shouldIncludeStateRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateOnOrBefore(dates, context.filters.to)
}
