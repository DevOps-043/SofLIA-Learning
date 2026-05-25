import type {
  CourseMinRow,
  EnrollmentRow,
  LearningPathItemFlatRow,
  LearningPathRow,
} from './learning-path-access.types'
import { isCourseCompleted } from './learning-path-access-enrollments.server'

export function buildLearningPathAccessState(params: {
  selectedPath: LearningPathRow
  items: LearningPathItemFlatRow[]
  courses: CourseMinRow[]
  enrollmentMap: Map<string, EnrollmentRow>
  currentCourseId: string
}) {
  const courseMap = new Map(params.courses.map((course) => [course.id, course]))
  let previousCourseCompleted = true
  let completedItemsCount = 0

  const mappedItems = params.items.map((item) => {
    const completed = isCourseCompleted(params.enrollmentMap.get(item.course_id))
    const unlocked = previousCourseCompleted
    const courseInfo = courseMap.get(item.course_id)

    if (completed) completedItemsCount += 1
    previousCourseCompleted = previousCourseCompleted && completed

    return {
      courseId: item.course_id,
      slug: courseInfo?.slug || null,
      title: courseInfo?.title || 'Curso sin tÃ­tulo',
      position: item.position,
      isCompleted: completed,
      isUnlocked: unlocked,
      isCurrent: item.course_id === params.currentCourseId,
    }
  })

  const totalItemsCount = mappedItems.length
  const progressPercentage = totalItemsCount > 0
    ? Math.round((completedItemsCount / totalItemsCount) * 100)
    : 0

  return {
    learningPathId: params.selectedPath.id,
    title: params.selectedPath.title,
    description: params.selectedPath.description,
    currentCourseId: params.currentCourseId,
    currentCourseUnlocked:
      mappedItems.find((item) => item.courseId === params.currentCourseId)?.isUnlocked ?? true,
    progressPercentage,
    completedItemsCount,
    totalItemsCount,
    items: mappedItems,
  }
}
