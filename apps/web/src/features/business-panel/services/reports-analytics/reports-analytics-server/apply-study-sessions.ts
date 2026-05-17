import { REPORTS_ANALYTICS_UNSPECIFIED } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { unwrapRelation } from './unwrap-relation'
import type { BuildContext } from './build-context'
import type { StudySessionRecord } from './study-session-record'

export function applyStudySessions(context: BuildContext, records: StudySessionRecord[]): void {
  records.forEach((record) => {
    const courseId = record.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.start_time,
        record.end_time,
        record.completed_at,
        record.started_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(record.courses)?.title)
    const status = record.status.toLowerCase()

    user.detail.plannedSessions += 1
    user.plannedMinutes.push(Number(record.duration_minutes) || 0)
    if (record.actual_duration_minutes !== null) {
      user.actualMinutes.push(Number(record.actual_duration_minutes) || 0)
    }
    course.activeLearners.add(record.user_id)

    if (status === 'completed' || record.completed_at) {
      user.detail.completedSessions += 1
    }

    if (status === 'missed' || status === 'overdue' || status === 'skipped') {
      user.detail.missedSessions += 1
    }

    pushLastActivity(user, record.start_time, record.completed_at, record.started_at, record.updated_at)
  })
}
