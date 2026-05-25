import type { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { withOrganizationFilter } from '@/lib/utils/organization-query'
import type {
  AssignmentRow,
  CertificateRow,
  EnrollmentRow,
  LessonProgressRow,
} from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function fetchAssignments(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select('id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)
    .order('assigned_at', { ascending: false })

  if (error) logger.error('Error fetching assignments:', error)
  return (data || []) as AssignmentRow[]
}

export async function fetchEnrollments(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<EnrollmentRow[]> {
  const { data, error } = await withOrganizationFilter(
    supabase
      .from('user_course_enrollments')
      .select('enrollment_id, user_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, completed_at, last_accessed_at')
      .in('user_id', userIds)
      .order('enrolled_at', { ascending: false }),
    organizationId,
  )

  if (error) logger.error('Error fetching enrollments:', error)
  return (data || []) as EnrollmentRow[]
}

export async function fetchLessonProgress(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<LessonProgressRow[]> {
  const { data, error } = await withOrganizationFilter(
    supabase
      .from('user_lesson_progress')
      .select('progress_id, user_id, lesson_id, is_completed, time_spent_minutes, completed_at, started_at, enrollment_id, user_course_enrollments!inner (course_id)')
      .in('user_id', userIds),
    organizationId,
  )

  if (error) logger.error('Error fetching lesson progress:', error)
  return (data || []) as LessonProgressRow[]
}

export async function fetchCertificates(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<CertificateRow[]> {
  const { data, error } = await withOrganizationFilter(
    supabase
      .from('user_course_certificates')
      .select('certificate_id, user_id, course_id, issued_at')
      .in('user_id', userIds),
    organizationId,
  )

  if (error) logger.error('Error fetching certificates:', error)
  return (data || []) as CertificateRow[]
}
