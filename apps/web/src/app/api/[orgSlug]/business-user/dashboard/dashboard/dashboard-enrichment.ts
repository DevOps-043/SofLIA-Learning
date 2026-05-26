import type { AssignedLearningPathDashboard } from '@/features/learning-paths/services/learning-path-dashboard.service'
import { logger } from '@/lib/utils/logger'
import type {
  DashboardAuthContext,
  DashboardBaseData,
  DashboardEnrichmentData,
  DashboardSupabaseClient,
  EnrollmentRow,
  InstructorSummary,
  InstructorRow,
} from './dashboard.types'

function buildInstructorMap(instructors: InstructorRow[] | null): Map<string, InstructorSummary> {
  const instructorMap = new Map<string, InstructorSummary>()
  instructors?.forEach((instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    instructorMap.set(instructor.id, { name: fullName || instructor.username || 'Instructor' })
  })
  return instructorMap
}

export async function fetchDashboardEnrichment(
  supabase: DashboardSupabaseClient,
  auth: DashboardAuthContext,
  baseData: DashboardBaseData,
  preloadedLearningPaths?: AssignedLearningPathDashboard[],
): Promise<DashboardEnrichmentData> {
  const [enrollmentsResult, instructorsResult, learningPaths] = await Promise.all([
    baseData.courseIds.length > 0
      ? supabase
          .from('user_course_enrollments')
          .select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at')
          .eq('user_id', auth.userId)
          .in('course_id', baseData.courseIds)
          .returns<EnrollmentRow[]>()
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    baseData.instructorIds.length > 0
      ? supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', baseData.instructorIds)
          .returns<InstructorRow[]>()
      : Promise.resolve({ data: [] }),
    preloadedLearningPaths
      ? Promise.resolve(preloadedLearningPaths)
      : Promise.resolve([] as AssignedLearningPathDashboard[]),
  ])

  if (enrollmentsResult.error) logger.error('Error fetching enrollments:', enrollmentsResult.error)

  return {
    enrollmentsMap: new Map((enrollmentsResult.data || []).map((enrollment) => [enrollment.course_id, enrollment])),
    instructorMap: buildInstructorMap(instructorsResult.data || null),
    learningPaths,
  }
}
