import { calculateDaysBetween, clampPercentage } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { isCompletedStatus } from './is-completed-status'
import { pushLastActivity } from './push-last-activity'
import { recordCompletedCourse } from './record-completed-course'
import { shouldIncludeStateRecord } from './should-include-state-record'
import { unwrapRelation } from './unwrap-relation'
import { updateCourseProgress } from './update-course-progress'
import type { BuildContext } from './build-context'
import type { EnrollmentRecord } from './enrollment-record'

export function applyEnrollments(context: BuildContext, enrollments: EnrollmentRecord[]): void {
  enrollments.forEach((enrollment) => {
    if (
      !shouldIncludeStateRecord(context, enrollment.user_id, enrollment.course_id, [
        enrollment.enrolled_at,
        enrollment.started_at,
        enrollment.completed_at,
        enrollment.last_accessed_at,
        enrollment.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(enrollment.user_id)
    if (!user) return

    const course = ensureCourse(context, enrollment.course_id, unwrapRelation(enrollment.courses)?.title)
    const progress = clampPercentage(Number(enrollment.overall_progress_percentage) || 0)
    const completed = isCompletedStatus(enrollment.enrollment_status) || progress >= 100 || Boolean(enrollment.completed_at)

    user.assignedCourseIds.add(enrollment.course_id)
    course.assignedUsers.add(enrollment.user_id)
    updateCourseProgress(user, course, enrollment.user_id, enrollment.course_id, progress)
    course.activeLearners.add(enrollment.user_id)

    if (completed) {
      const completionDays = calculateDaysBetween(enrollment.enrolled_at || enrollment.started_at, enrollment.completed_at || enrollment.last_accessed_at || enrollment.updated_at)
      if (completionDays !== null) user.completionDays.push(completionDays)
      recordCompletedCourse(
        context,
        user,
        course,
        enrollment.user_id,
        enrollment.course_id,
        enrollment.completed_at || enrollment.last_accessed_at || enrollment.updated_at,
      )
    }

    pushLastActivity(user, enrollment.enrolled_at, enrollment.started_at, enrollment.completed_at, enrollment.last_accessed_at, enrollment.updated_at)
  })
}
