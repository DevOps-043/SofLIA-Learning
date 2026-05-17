import type {
  AssignedCourse,
  DirectAssignmentRow,
  EnrollmentRow,
  InstructorSummary,
} from './dashboard.types'

interface CourseMapContext {
  certificatesMap: Map<string, boolean>
  enrollmentsMap: Map<string, EnrollmentRow>
  instructorMap: Map<string, InstructorSummary>
}

function resolveStatus(
  progress: number,
  assignment: DirectAssignmentRow,
  enrollment?: EnrollmentRow,
): AssignedCourse['status'] {
  if (progress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed') {
    return 'Completado'
  }
  return progress > 0 ? 'En progreso' : 'No iniciado'
}

function resolveThumbnail(course: NonNullable<DirectAssignmentRow['courses']>) {
  if (course.thumbnail_url) return course.thumbnail_url

  const title = course.title?.toLowerCase() || ''
  if (title.includes('python')) return '🐍'
  if (title.includes('ia') || title.includes('ai') || title.includes('generativa')) return '🤖'
  if (title.includes('diseño') || title.includes('ux') || title.includes('ui')) return '🎨'
  if (title.includes('machine learning') || title.includes('ml')) return '🧠'
  if (title.includes('datos') || title.includes('data')) return '📊'
  return '📚'
}

function getActualProgress(assignment: DirectAssignmentRow, enrollment?: EnrollmentRow) {
  if (enrollment?.overall_progress_percentage !== null && enrollment?.overall_progress_percentage !== undefined) {
    return Number(enrollment.overall_progress_percentage)
  }
  return assignment.completion_percentage ? Number(assignment.completion_percentage) : 0
}

export function mapAssignmentsToCourses(
  assignments: DirectAssignmentRow[],
  context: CourseMapContext,
): AssignedCourse[] {
  return assignments.map((assignment) => {
    const course = assignment.courses!
    const instructor = course.instructor_id ? context.instructorMap.get(course.instructor_id) : null
    const enrollment = context.enrollmentsMap.get(assignment.course_id)
    const actualProgress = getActualProgress(assignment, enrollment)
    const actualCompletedAt = enrollment?.completed_at || assignment.completed_at

    return {
      id: assignment.id,
      course_id: assignment.course_id,
      title: course.title || 'Curso sin título',
      instructor: instructor?.name || 'Instructor',
      progress: Math.round(actualProgress * 100) / 100,
      status: resolveStatus(actualProgress, assignment, enrollment),
      thumbnail: resolveThumbnail(course),
      slug: course.slug || '',
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date || undefined,
      completed_at: actualCompletedAt || undefined,
      has_certificate: context.certificatesMap.has(assignment.course_id) || false,
      source: assignment.source,
    }
  })
}
