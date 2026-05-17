import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BusinessUserStatsAssignmentRecord,
  BusinessUserStatsEnrollmentRecord,
} from './completion.records'

export function fetchEnrollmentRows(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
) {
  return supabase
    .from('user_course_enrollments')
    .select(`
      enrollment_id,
      enrollment_status,
      overall_progress_percentage,
      enrolled_at,
      started_at,
      completed_at,
      last_accessed_at,
      course_id,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        category,
        level
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })
}

export function fetchAssignmentRows(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
) {
  return supabase
    .from('organization_course_assignments')
    .select(`
      id,
      course_id,
      status,
      completion_percentage,
      assigned_at,
      due_date,
      completed_at,
      courses (
        id,
        title
      )
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false })
}

export function toEnrollmentRecords(data: unknown): BusinessUserStatsEnrollmentRecord[] {
  return (data || []) as BusinessUserStatsEnrollmentRecord[]
}

export function toAssignmentRecords(data: unknown): BusinessUserStatsAssignmentRecord[] {
  return (data || []) as BusinessUserStatsAssignmentRecord[]
}
