import type { getServiceClient } from '@/core/supabase/service-client'

type AnalyticsClient = ReturnType<typeof getServiceClient>

export function fetchOrganizationUsers(client: AnalyticsClient, organizationId: string) {
  return client
    .from('organization_users')
    .select(`
      user_id,
      role,
      status,
      joined_at,
      job_title,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        last_login_at
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
}

export async function fetchAnalyticsQueryResults(
  client: AnalyticsClient,
  organizationId: string,
  userIds: string[],
  sixMonthsAgoIso: string,
) {
  const sixMonthsAgoDate = sixMonthsAgoIso.split('T')[0]

  const [
    assignments,
    enrollments,
    certificates,
    lessonProgress,
    dailyProgress,
    studySessions,
    nodes,
  ] = await Promise.all([
    client
      .from('organization_course_assignments')
      .select('id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at')
      .eq('organization_id', organizationId)
      .in('user_id', userIds),
    client
      .from('user_course_enrollments')
      .select('enrollment_id, user_id, course_id, overall_progress_percentage, enrollment_status, completed_at, started_at')
      .in('user_id', userIds),
    client
      .from('user_course_certificates')
      .select('certificate_id, user_id, course_id, issued_at')
      .eq('organization_id', organizationId)
      .in('user_id', userIds),
    client
      .from('user_lesson_progress')
      .select('progress_id, user_id, lesson_id, enrollment_id, time_spent_minutes, is_completed, completed_at, last_accessed_at, quiz_completed, quiz_passed')
      .in('user_id', userIds),
    client
      .from('daily_progress')
      .select('user_id, progress_date, had_activity, streak_count, study_minutes, sessions_completed, sessions_missed')
      .in('user_id', userIds)
      .gte('progress_date', sixMonthsAgoDate),
    client
      .from('study_sessions')
      .select('id, user_id, start_time, actual_duration_minutes, status, completed_at, session_type')
      .in('user_id', userIds)
      .gte('start_time', sixMonthsAgoIso),
    client
      .from('organization_nodes')
      .select('id, name, type, properties, organization_node_users(user_id)')
      .eq('organization_id', organizationId)
      .eq('type', 'team'),
  ])

  return {
    assignments,
    enrollments,
    certificates,
    lessonProgress,
    dailyProgress,
    studySessions,
    nodes,
  }
}
