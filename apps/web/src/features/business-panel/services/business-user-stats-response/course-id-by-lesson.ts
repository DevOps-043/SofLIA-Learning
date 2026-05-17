import type { BusinessUserStatsLessonProgressRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function createCourseIdByLessonId(records: BusinessUserStatsLessonProgressRecord[]) {
  const courseIdByLessonId = new Map<string, string>()

  records.forEach((progress) => {
    const enrollment = unwrapRelation(progress.user_course_enrollments)
    if (progress.lesson_id && enrollment?.course_id) {
      courseIdByLessonId.set(progress.lesson_id, enrollment.course_id)
    }
  })

  return courseIdByLessonId
}
