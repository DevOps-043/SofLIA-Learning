import { CourseLessonRecord } from './course-lesson-record'
import { getCourseIdFromLesson } from './get-course-id-from-lesson'

export function groupCourseLessonsByCourse(
  courseLessons: CourseLessonRecord[],
): Map<string, CourseLessonRecord[]> {
  const map = new Map<string, CourseLessonRecord[]>()

  courseLessons.forEach((lesson) => {
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), lesson])
  })

  return map
}
