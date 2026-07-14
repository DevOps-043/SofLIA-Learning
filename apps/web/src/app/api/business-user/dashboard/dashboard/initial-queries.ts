import { logger } from '@/lib/utils/logger'
import type { CertificateRow, DashboardSupabaseClient, DirectAssignmentRow } from './types'

export async function fetchInitialDashboardData(
  supabase: DashboardSupabaseClient,
  userId: string,
  organizationId: string
) {
  // Nota: la antigua consulta a `work_team_members`/`work_teams` se eliminó.
  // Esas tablas ya no existen (las sustituyó la jerarquía de organización), así
  // que fallaba en cada carga del dashboard y siempre devolvía cero equipos.
  const [directAssignments, certificates] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select(`
        id, course_id, status, completion_percentage, assigned_at, due_date,
        completed_at, courses (id, title, slug, thumbnail_url, instructor_id)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .order('assigned_at', { ascending: false })
      .limit(100),
    supabase
      .from('user_course_certificates')
      .select('certificate_id, course_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .limit(100),
  ])

  if (directAssignments.error) logger.error('❌ Error fetching direct assignments:', directAssignments.error)
  if (certificates.error) logger.error('❌ Error fetching certificates:', certificates.error)

  return {
    directAssignments: (directAssignments.data || []) as DirectAssignmentRow[],
    certificates: (certificates.data || []) as CertificateRow[],
  }
}
