import { clampPercentage } from '../../reports-analytics/reports-analytics.helpers'
import { AssignmentRecord } from './assignment-record'
import { EnrollmentRecord } from './enrollment-record'
import { resolveCourseStatus } from './resolve-course-status'

export function buildCompletedCourseIds(
  assignments: AssignmentRecord[],
  enrollments: EnrollmentRecord[],
): Set<string> {
  const completedCourseIds = new Set<string>()

  assignments.forEach((assignment) => {
    const enrollment = enrollments.find((item) => item.course_id === assignment.course_id)
    const progress = clampPercentage(
      Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0),
    )
    const status = resolveCourseStatus(assignment.status, enrollment?.enrollment_status, progress)
    if (status === 'completed' || progress >= 100) {
      completedCourseIds.add(assignment.course_id)
    }
  })

  enrollments.forEach((enrollment) => {
    const progress = clampPercentage(Number(enrollment.overall_progress_percentage ?? 0))
    const status = resolveCourseStatus(null, enrollment.enrollment_status, progress)
    if (status === 'completed' || progress >= 100) {
      completedCourseIds.add(enrollment.course_id)
    }
  })

  return completedCourseIds
}
