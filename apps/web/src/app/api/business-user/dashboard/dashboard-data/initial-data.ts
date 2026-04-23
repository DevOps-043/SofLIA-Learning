import { logger } from '@/lib/utils/logger'
import type { CertificateRow, DirectAssignmentRow, SupabaseServerClient } from './types'

export async function getInitialDashboardData(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId: string,
) {
  const [
    { data: userTeamMemberships, error: teamMembershipsError },
    { data: directAssignments, error: directAssignmentsError },
    { data: certificates, error: certificatesError },
  ] = await Promise.all([
    supabase.from('work_team_members').select('team_id, status, work_teams!inner(organization_id)').eq('user_id', userId).eq('status', 'active').eq('work_teams.organization_id', organizationId),
    supabase.from('organization_course_assignments').select(`
      id, course_id, status, completion_percentage, assigned_at, due_date, completed_at,
      courses ( id, title, slug, thumbnail_url, instructor_id )
    `).eq('user_id', userId).eq('organization_id', organizationId).in('status', ['assigned', 'in_progress', 'completed']).order('assigned_at', { ascending: false }).limit(100),
    supabase.from('user_course_certificates').select('certificate_id, course_id').eq('user_id', userId).limit(100),
  ])

  if (teamMembershipsError) logger.error('Error fetching team memberships:', teamMembershipsError)
  if (directAssignmentsError) logger.error('Error fetching direct assignments:', directAssignmentsError)
  if (certificatesError) logger.error('Error fetching certificates:', certificatesError)

  return {
    userTeamIds: (userTeamMemberships ?? []).map((membership) => membership.team_id),
    directAssignments: (directAssignments ?? []) as DirectAssignmentRow[],
    certificates: (certificates ?? []) as CertificateRow[],
  }
}
