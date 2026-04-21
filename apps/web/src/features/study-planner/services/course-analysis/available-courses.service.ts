import type { CourseInfo } from '../../types/user-context.types'
import { mapCourseInfo } from '../course-query.shared'
import {
  fetchActivePurchasedCourseIds,
  fetchAvailableCourseRows,
} from './db'

export async function getAvailableCoursesForSuggestion(
  userId: string,
  category?: string,
  level?: string,
  limit = 10,
): Promise<CourseInfo[]> {
  const excludedCourseIds = await fetchActivePurchasedCourseIds(userId)
  const courseRows = await fetchAvailableCourseRows({
    category,
    level,
    limit,
    excludedCourseIds,
  })

  return courseRows.map((courseRow) => mapCourseInfo(courseRow))
}
