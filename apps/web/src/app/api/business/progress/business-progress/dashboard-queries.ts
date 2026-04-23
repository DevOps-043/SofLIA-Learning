import { withOrganizationFilter } from '@/lib/utils/organization-query'
import { logger } from '@/lib/utils/logger'
import type {
  AssignmentRow,
  BusinessProgressSupabaseClient,
  CertificateRow,
  DashboardQueriesResult,
  EnrollmentRow,
  LessonProgressRow,
} from './types'

export async function fetchDashboardProgressData(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<DashboardQueriesResult> {
  const [assignments, enrollments, lessonProgress, certificates] = await Promise.all([
    fetchAssignments(supabase, organizationId, userIds),
    fetchEnrollments(supabase, organizationId, userIds),
    fetchLessonProgress(supabase, organizationId, userIds),
    fetchCertificates(supabase, organizationId, userIds),
  ])

  return { assignments, enrollments, lessonProgress, certificates }
}

async function fetchAssignments(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
  userIds: string[],
) {
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select('id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)
    .order('assigned_at', { ascending: false })

  if (error) {
    logger.error('Error fetching assignments:', error)
    return []
  }

  logger.log('✅ Asignaciones obtenidas:', data?.length || 0)
  if (data && data.length > 0) {
    logger.log('📊 Primeras asignaciones:', JSON.stringify(data.slice(0, 3), null, 2))
  }

  return (data || []) as AssignmentRow[]
}

async function fetchEnrollments(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
  userIds: string[],
) {
  const query = supabase
    .from('user_course_enrollments')
    .select('enrollment_id, user_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, completed_at, last_accessed_at')
    .in('user_id', userIds)
    .order('enrolled_at', { ascending: false })

  const { data, error } = await withOrganizationFilter(query, organizationId)
  if (error) {
    logger.error('Error fetching enrollments:', error)
    return []
  }
  return (data || []) as EnrollmentRow[]
}

async function fetchLessonProgress(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
  userIds: string[],
) {
  const query = supabase
    .from('user_lesson_progress')
    .select('progress_id, user_id, lesson_id, is_completed, time_spent_minutes, completed_at, started_at, enrollment_id, user_course_enrollments!inner (course_id)')
    .in('user_id', userIds)

  const { data, error } = await withOrganizationFilter(query, organizationId)
  if (error) {
    logger.error('Error fetching lesson progress:', error)
    return []
  }
  return (data || []) as LessonProgressRow[]
}

async function fetchCertificates(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
  userIds: string[],
) {
  const query = supabase
    .from('user_course_certificates')
    .select('certificate_id, user_id, course_id, issued_at')
    .in('user_id', userIds)

  const { data, error } = await withOrganizationFilter(query, organizationId)
  if (error) {
    logger.error('Error fetching certificates:', error)
    return []
  }
  return (data || []) as CertificateRow[]
}
