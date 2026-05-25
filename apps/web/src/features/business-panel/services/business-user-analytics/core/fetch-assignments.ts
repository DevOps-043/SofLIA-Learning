import { AssignmentRecord } from './assignment-record'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchAssignments(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select(`
      id,
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
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(PAGE_LIMIT)
    .returns<AssignmentRecord[]>()

  logQueryError('business user assignments', error)
  return data || []
}
