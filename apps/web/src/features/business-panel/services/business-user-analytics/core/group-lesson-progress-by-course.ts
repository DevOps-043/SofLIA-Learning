import { LessonProgressRecord } from './lesson-progress-record'

export function groupLessonProgressByCourse(
  lessonProgress: LessonProgressRecord[],
  enrollmentCourseById: Map<string, string>,
): Map<string, LessonProgressRecord[]> {
  const map = new Map<string, LessonProgressRecord[]>()

  lessonProgress.forEach((progress) => {
    const courseId = enrollmentCourseById.get(progress.enrollment_id)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), progress])
  })

  return map
}
