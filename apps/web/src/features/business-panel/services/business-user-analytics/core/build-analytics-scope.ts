import { AnalyticsScope } from './analytics-scope'
import { AssignmentRecord } from './assignment-record'
import { CourseLessonRecord } from './course-lesson-record'
import { EnrollmentRecord } from './enrollment-record'

export function buildAnalyticsScope(
  assignments: AssignmentRecord[],
  enrollments: EnrollmentRecord[],
  courseLessons: CourseLessonRecord[],
): AnalyticsScope {
  return {
    courseIds: new Set([
      ...assignments.map((assignment) => assignment.course_id),
      ...enrollments.map((enrollment) => enrollment.course_id),
    ]),
    enrollmentIds: new Set(enrollments.map((enrollment) => enrollment.enrollment_id)),
    lessonIds: new Set(courseLessons.map((lesson) => lesson.lesson_id)),
  }
}
