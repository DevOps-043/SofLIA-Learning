import { fetchPagedRows } from './fetch-paged-rows'
import type { AssignmentRecord } from './assignment-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchAssignmentRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
): Promise<AssignmentRecord[]> {
  return fetchPagedRows<AssignmentRecord>('assignments', (from, to) =>
    supabase
      .from('organization_course_assignments')
      .select(`
        id,
        user_id,
        course_id,
        status,
        completion_percentage,
        assigned_at,
        due_date,
        completed_at,
        updated_at,
        courses (
          id,
          title
        )
      `)
      .eq('organization_id', organizationId)
      .range(from, to),
  )
}
