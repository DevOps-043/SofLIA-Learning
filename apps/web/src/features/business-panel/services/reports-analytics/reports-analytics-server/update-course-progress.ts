import type { MutableCourseStats } from './mutable-course-stats'
import type { MutableUserStats } from './mutable-user-stats'

export function updateCourseProgress(
  user: MutableUserStats,
  course: MutableCourseStats,
  userId: string,
  courseId: string,
  progress: number,
): void {
  const currentProgress = user.progressByCourse.get(courseId) || 0
  const finalProgress = Math.max(currentProgress, progress)
  user.progressByCourse.set(courseId, finalProgress)

  const currentCourseProgress = course.progressByUser.get(userId) || 0
  course.progressByUser.set(userId, Math.max(currentCourseProgress, finalProgress))
}
