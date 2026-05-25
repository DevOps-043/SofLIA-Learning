import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'

export function isCompletedCourseStats(
  course: BusinessUserStatsCourseData,
): boolean {
  return course.status === 'completed' || course.progress >= 100
}

export function isInProgressCourseStats(
  course: BusinessUserStatsCourseData,
): boolean {
  return !isCompletedCourseStats(course) && course.progress > 0
}
