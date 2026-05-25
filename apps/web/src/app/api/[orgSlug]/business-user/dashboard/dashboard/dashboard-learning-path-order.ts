import { logger } from '@/lib/utils/logger'
import type { AssignedLearningPathDashboard } from '@/features/learning-paths/services/learning-path-dashboard.service'
import type { AssignedCourse } from './dashboard.types'

export function applyLearningPathOrder(
  courses: AssignedCourse[],
  learningPaths: AssignedLearningPathDashboard[],
) {
  if (courses.length === 0 || learningPaths.length === 0) return

  const coursePositionMap = new Map<string, number>()

  for (const learningPath of learningPaths) {
    for (const item of learningPath.items) {
      const existingPosition = coursePositionMap.get(item.courseId)
      if (existingPosition === undefined || item.position < existingPosition) {
        coursePositionMap.set(item.courseId, item.position)
      }
    }
  }

  if (coursePositionMap.size === 0) return

  for (const course of courses) {
    const position = coursePositionMap.get(course.course_id)
    if (position !== undefined) {
      course.learning_path_position = position
    }
  }

  courses.sort((a, b) => {
    const positionA = a.learning_path_position ?? Infinity
    const positionB = b.learning_path_position ?? Infinity
    return positionA - positionB
  })

  logger.log('Courses sorted by learning path position:', coursePositionMap)
}
