import { AssignmentRecord } from './assignment-record'
import { EnrollmentRecord } from './enrollment-record'

export function getCourseCompletionDate(
  assignment: AssignmentRecord,
  enrollments: EnrollmentRecord[],
): string | null {
  const enrollment = enrollments.find((item) => item.course_id === assignment.course_id)
  return enrollment?.completed_at || assignment.completed_at
}
