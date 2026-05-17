import { REPORTS_ANALYTICS_UNSPECIFIED } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeStateRecord } from './should-include-state-record'
import { unwrapRelation } from './unwrap-relation'
import type { BuildContext } from './build-context'
import type { LessonProgressRecord } from './lesson-progress-record'

export function applyLessonProgress(context: BuildContext, records: LessonProgressRecord[]): void {
  records.forEach((record) => {
    const enrollment = unwrapRelation(record.user_course_enrollments)
    const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED

    if (
      !shouldIncludeStateRecord(context, record.user_id, courseId, [
        record.started_at,
        record.completed_at,
        record.last_accessed_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(enrollment?.courses)?.title)
    course.activeLearners.add(record.user_id)

    if (record.is_completed) {
      user.detail.completedLessons += 1
    }

    user.detail.timeSpentMinutes += Number(record.time_spent_minutes) || 0
    pushLastActivity(user, record.started_at, record.completed_at, record.last_accessed_at, record.updated_at)
  })
}
