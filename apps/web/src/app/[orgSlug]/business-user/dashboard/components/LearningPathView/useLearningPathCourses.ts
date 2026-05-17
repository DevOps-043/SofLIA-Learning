import { useMemo } from 'react'
import type { AssignedCourse, AssignedLearningPath } from '../../types'
import { buildStandalonePathItem } from './course-builders'

interface UseLearningPathCoursesArgs {
  assignedCourses: AssignedCourse[]
  learningPaths: AssignedLearningPath[]
}

export function useLearningPathCourses({
  assignedCourses,
  learningPaths,
}: UseLearningPathCoursesArgs) {
  const assignedCoursesById = useMemo(() => {
    const map = new Map<string, AssignedCourse>()
    for (const course of assignedCourses) {
      map.set(course.course_id, course)
    }
    return map
  }, [assignedCourses])

  const standaloneCourses = useMemo(() => {
    const learningPathCourseIds = new Set<string>()

    for (const learningPath of learningPaths) {
      for (const item of learningPath.items) {
        learningPathCourseIds.add(item.courseId)
      }
    }

    return assignedCourses.filter((course) => !learningPathCourseIds.has(course.course_id))
  }, [assignedCourses, learningPaths])

  const standaloneItems = useMemo(
    () => standaloneCourses.map((course, index) => buildStandalonePathItem(course, index)),
    [standaloneCourses],
  )

  const learningPathIdKey = useMemo(
    () => learningPaths.map((path) => path.id).join('|'),
    [learningPaths],
  )

  return {
    assignedCoursesById,
    learningPathIdKey,
    standaloneCourses,
    standaloneItems,
  }
}
