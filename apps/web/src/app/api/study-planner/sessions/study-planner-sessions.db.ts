import type { createAdminClient } from '@/lib/supabase/admin'
import type { StudyPlannerSession } from './study-planner-sessions.types'

type StudyPlannerAdminClient = ReturnType<typeof createAdminClient>

const STUDY_PLANNER_SESSION_SELECT = `
  id,
  title,
  description,
  start_time,
  end_time,
  status,
  course_id,
  lesson_id,
  is_ai_generated,
  session_type,
  external_event_id,
  calendar_provider
`

interface GetStudySessionsForRangeParams {
  userId: string
  planId: string
  startDate: Date
  endDate: Date
}

export async function getLatestStudyPlanId(
  supabase: StudyPlannerAdminClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) {
    return null
  }

  return data[0]?.id ?? null
}

export async function getStudySessionsForRange(
  supabase: StudyPlannerAdminClient,
  params: GetStudySessionsForRangeParams,
): Promise<StudyPlannerSession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(STUDY_PLANNER_SESSION_SELECT)
    .eq('user_id', params.userId)
    .eq('plan_id', params.planId)
    .gte('start_time', params.startDate.toISOString())
    .lte('end_time', params.endDate.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error('Error al obtener sesiones')
  }

  return (data || []) as StudyPlannerSession[]
}
