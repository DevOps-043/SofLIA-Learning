import { logger } from '@/lib/utils/logger'
import type { SupabaseServerClient, TeamAssignmentRow } from './types'

export async function getTeamCourseAssignments(
  supabase: SupabaseServerClient,
  userTeamIds: string[],
) {
  if (!userTeamIds.length) return [] as TeamAssignmentRow[]

  const { data, error } = await supabase
    .from('work_team_course_assignments')
    .select(`
      id, team_id, course_id, status, assigned_at, due_date, message,
      courses ( id, title, slug, thumbnail_url, instructor_id )
    `)
    .in('team_id', userTeamIds)
    .in('status', ['assigned', 'in_progress', 'completed'])
    .order('assigned_at', { ascending: false })
    .limit(100)

  if (error) logger.error('Error fetching team assignments:', error)
  return (data ?? []) as TeamAssignmentRow[]
}
