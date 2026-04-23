import { logger } from '@/lib/utils/logger'
import { getRelatedCourseSummary } from './course-summary'
import type {
  CombinedAssignmentRow,
  EnrollmentRow,
  InstructorRow,
  SupabaseServerClient,
} from './types'

export async function getCourseMetadata(
  supabase: SupabaseServerClient,
  userId: string,
  courseIds: string[],
  combinedAssignments: CombinedAssignmentRow[],
) {
  const instructorIds = [...new Set(combinedAssignments.map((assignment) => getRelatedCourseSummary(assignment.courses)?.instructor_id).filter((id): id is string => Boolean(id)))]
  const [enrollmentsResult, instructorsResult] = await Promise.all([
    courseIds.length ? supabase.from('user_course_enrollments').select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at').eq('user_id', userId).in('course_id', courseIds).limit(100) : Promise.resolve({ data: [] as EnrollmentRow[], error: null }),
    instructorIds.length ? supabase.from('users').select('id, first_name, last_name, username').in('id', instructorIds) : Promise.resolve({ data: [] as InstructorRow[] }),
  ])

  const enrollmentsMap = new Map<string, EnrollmentRow>()
  if (!enrollmentsResult.error) {
    ;(enrollmentsResult.data ?? []).forEach((enrollment) => enrollmentsMap.set(enrollment.course_id, enrollment))
  } else {
    logger.error('Error fetching enrollments:', enrollmentsResult.error)
  }

  const instructorMap = new Map<string, { name: string }>()
  ;(instructorsResult.data ?? []).forEach((instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    instructorMap.set(instructor.id, { name: fullName || instructor.username || 'Instructor' })
  })

  return { enrollmentsMap, instructorMap }
}
