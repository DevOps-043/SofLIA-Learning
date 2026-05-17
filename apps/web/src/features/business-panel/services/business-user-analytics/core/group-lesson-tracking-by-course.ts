import { CourseLessonRecord } from './course-lesson-record'
import { getCourseIdFromLesson } from './get-course-id-from-lesson'
import { LessonTrackingRecord } from './lesson-tracking-record'

export function groupLessonTrackingByCourse(
  lessonTracking: LessonTrackingRecord[],
  courseLessons: CourseLessonRecord[],
): Map<string, LessonTrackingRecord[]> {
  const courseByLessonId = new Map(
    courseLessons
      .map((lesson) => [lesson.lesson_id, getCourseIdFromLesson(lesson)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  )
  const map = new Map<string, LessonTrackingRecord[]>()

  lessonTracking.forEach((tracking) => {
    const courseId = courseByLessonId.get(tracking.lesson_id)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), tracking])
  })

  return map
}
