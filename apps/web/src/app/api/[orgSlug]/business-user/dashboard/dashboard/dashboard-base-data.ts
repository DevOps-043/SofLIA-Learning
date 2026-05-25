import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { logger } from '@/lib/utils/logger'
import type {
  CertificateRow,
  DashboardAuthContext,
  DashboardBaseData,
  DashboardSupabaseClient,
  DirectAssignmentRow,
} from './dashboard.types'

function hasCourse(assignment: DirectAssignmentRow): assignment is DirectAssignmentRow & {
  courses: NonNullable<DirectAssignmentRow['courses']>
} {
  return assignment.courses !== null
}

export async function fetchDashboardBaseData(
  supabase: DashboardSupabaseClient,
  auth: DashboardAuthContext,
): Promise<DashboardBaseData> {
  await LearningPathDefaultsService.applyDefaultRulesForUser({
    userId: auth.userId,
    organizationId: auth.organizationId,
  }).catch((err: unknown) => {
    logger.error('Error applying default learning paths for dashboard:', err)
  })

  const [assignmentsResult, certificatesResult] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select(`
        id, course_id, status, completion_percentage, assigned_at, due_date, completed_at,
        courses ( id, title, slug, thumbnail_url, instructor_id )
      `)
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .order('assigned_at', { ascending: false })
      .returns<DirectAssignmentRow[]>()
      .limit(100),
    supabase
      .from('user_course_certificates')
      .select('certificate_id, course_id')
      .eq('user_id', auth.userId)
      .returns<CertificateRow[]>()
      .limit(100),
  ])

  if (assignmentsResult.error) logger.error('Error fetching direct assignments:', assignmentsResult.error)
  if (certificatesResult.error) logger.error('Error fetching certificates:', certificatesResult.error)

  const combinedAssignments = (assignmentsResult.data || [])
    .filter(hasCourse)
    .map((assignment) => ({ ...assignment, source: 'direct' as const }))
  const courseIds = Array.from(new Set(combinedAssignments.map((assignment) => assignment.course_id)))
  const instructorIds = Array.from(new Set(
    combinedAssignments
      .map((assignment) => assignment.courses?.instructor_id)
      .filter((instructorId): instructorId is string => Boolean(instructorId)),
  ))
  const certificates = certificatesResult.data || []
  const certificatesMap = new Map(certificates.map((certificate) => [certificate.course_id, true]))

  return { combinedAssignments, certificates, certificatesMap, courseIds, instructorIds }
}
