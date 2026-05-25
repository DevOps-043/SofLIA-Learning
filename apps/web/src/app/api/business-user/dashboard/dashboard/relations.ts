import { logger } from '@/lib/utils/logger'
import { getRelatedCourseSummary } from './course-summary'
import type {
  CombinedAssignmentRow,
  DashboardSupabaseClient,
  EnrollmentRow,
  InstructorRow,
} from './types'

export async function fetchDashboardCourseRelations(
  supabase: DashboardSupabaseClient,
  userId: string,
  courseIds: string[],
  combinedAssignments: CombinedAssignmentRow[]
) {
  const instructorIds = [...new Set(combinedAssignments
    .map((assignment) => getRelatedCourseSummary(assignment.courses)?.instructor_id)
    .filter((id): id is string => Boolean(id)))]
  const [enrollmentsResult, instructorsResult] = await Promise.all([
    courseIds.length > 0
      ? supabase
          .from('user_course_enrollments')
          .select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at')
          .eq('user_id', userId)
          .in('course_id', courseIds)
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    instructorIds.length > 0
      ? supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', instructorIds)
      : Promise.resolve({ data: [] }),
  ])

  if (enrollmentsResult.error) {
    logger.error('❌ Error fetching enrollments:', enrollmentsResult.error)
  }

  return {
    enrollments: (enrollmentsResult.data || []) as EnrollmentRow[],
    instructors: (instructorsResult.data || []) as InstructorRow[],
  }
}

export function mapEnrollmentsByCourse(enrollments: EnrollmentRow[]) {
  const enrollmentsMap = new Map<string, EnrollmentRow>()
  enrollments.forEach((enrollment) => enrollmentsMap.set(enrollment.course_id, enrollment))
  return enrollmentsMap
}

export function mapInstructorsById(instructors: InstructorRow[]) {
  const instructorMap = new Map<string, { name: string }>()
  instructors.forEach((instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    instructorMap.set(instructor.id, { name: fullName || instructor.username || 'Instructor' })
  })
  return instructorMap
}
