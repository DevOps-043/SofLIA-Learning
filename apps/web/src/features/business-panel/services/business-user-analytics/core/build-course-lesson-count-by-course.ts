import { incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { CourseLessonRecord } from './course-lesson-record'
import { getCourseIdFromLesson } from './get-course-id-from-lesson'

export function buildCourseLessonCountByCourse(courseLessons: CourseLessonRecord[]): Map<string, number> {
  const counts = new Map<string, number>()
  courseLessons.forEach((lesson) => {
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId) return
    incrementMap(counts, courseId)
  })
  return counts
}
