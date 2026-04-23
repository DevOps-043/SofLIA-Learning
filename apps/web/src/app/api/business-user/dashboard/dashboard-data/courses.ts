import { getAssignmentProgress, getAssignmentStatus } from './assignment-progress'
import { getRelatedCourseSummary } from './course-summary'
import { getCourseThumbnail } from './thumbnail'
import type {
  AssignedCourse,
  CombinedAssignmentRow,
  EnrollmentRow,
} from './types'

export function buildAssignedCourses(
  combinedAssignments: CombinedAssignmentRow[],
  enrollmentsMap: Map<string, EnrollmentRow>,
  instructorMap: Map<string, { name: string }>,
  certificatesMap: Map<string, boolean>,
) {
  const courses: AssignedCourse[] = []

  combinedAssignments.forEach((assignment) => {
    const course = getRelatedCourseSummary(assignment.courses)
    if (!course) return

    const enrollment = enrollmentsMap.get(assignment.course_id)
    const progress = getAssignmentProgress(assignment, enrollmentsMap)
    courses.push({
      id: assignment.id,
      course_id: assignment.course_id,
      title: course.title || 'Curso sin titulo',
      instructor: course.instructor_id ? instructorMap.get(course.instructor_id)?.name || 'Instructor' : 'Instructor',
      progress: Math.round(progress * 100) / 100,
      status: getAssignmentStatus(assignment, enrollment, progress),
      thumbnail: getCourseThumbnail(course.thumbnail_url, course.title),
      slug: course.slug || '',
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date || undefined,
      completed_at: enrollment?.completed_at || assignment.completed_at || undefined,
      has_certificate: certificatesMap.has(assignment.course_id) || false,
      source: assignment.source,
    })
  })

  return courses
}
