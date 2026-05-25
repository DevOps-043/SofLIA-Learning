import { getCourseThumbnail, getRelatedCourseSummary } from './course-summary'
import type {
  AssignedCourse,
  CombinedAssignmentRow,
  EnrollmentRow,
  RelatedCourseSummary,
} from './types'

interface BuildAssignedCoursesParams {
  combinedAssignments: CombinedAssignmentRow[]
  enrollmentsMap: Map<string, EnrollmentRow>
  instructorMap: Map<string, { name: string }>
  certificatesMap: Map<string, boolean>
}

export function buildAssignedCourses({
  combinedAssignments,
  enrollmentsMap,
  instructorMap,
  certificatesMap,
}: BuildAssignedCoursesParams): AssignedCourse[] {
  return combinedAssignments
    .map((assignment) => ({ assignment, course: getRelatedCourseSummary(assignment.courses) }))
    .filter(
      (entry): entry is { assignment: CombinedAssignmentRow; course: RelatedCourseSummary } =>
        entry.course !== null
    )
    .map(({ assignment, course }) => {
      const instructor = course.instructor_id ? instructorMap.get(course.instructor_id) : null
      const enrollment = enrollmentsMap.get(assignment.course_id)
      const progress = enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0
      const isCompleted = progress >= 100 ||
        assignment.status === 'completed' ||
        enrollment?.enrollment_status === 'completed'
      const status = isCompleted ? 'Completado' : progress > 0 ? 'En progreso' : 'No iniciado'

      return {
        id: assignment.id,
        course_id: assignment.course_id,
        title: course.title || 'Curso sin título',
        instructor: instructor?.name || 'Instructor',
        progress: Math.round(Number(progress) * 100) / 100,
        status,
        thumbnail: getCourseThumbnail(course.title, course.thumbnail_url),
        slug: course.slug || '',
        assigned_at: assignment.assigned_at,
        due_date: assignment.due_date || undefined,
        completed_at: enrollment?.completed_at || assignment.completed_at || undefined,
        has_certificate: certificatesMap.has(assignment.course_id),
        source: assignment.source,
      }
    })
}
