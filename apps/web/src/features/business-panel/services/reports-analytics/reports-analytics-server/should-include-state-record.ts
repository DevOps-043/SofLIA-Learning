import { isAnyDateOnOrBefore } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'
import { organizationAssignmentKey } from './organization-assignment-key'

export function shouldIncludeStateRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  // Reject records for courses that don't belong to this org.
  // applyAssignments precarga el conjunto completo antes de filtrar su primera
  // fila, por lo que aqui nunca depende del orden devuelto por la base.
  if (context.orgCourseScopeReady && courseId && !context.orgCourseIds.has(courseId)) return false
  if (
    context.orgCourseScopeReady &&
    courseId &&
    !context.orgAssignmentKeys.has(organizationAssignmentKey(userId, courseId))
  ) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateOnOrBefore(dates, context.filters.to)
}
