import type { StudyPlannerUpdateAdminClient } from './study-planner-session-update.types'
import type { StudyPlannerSessionUpdateRecord } from './study-planner-session-update.types'

const STUDY_SESSION_UPDATE_SELECT = `
  id,
  start_time
`

export async function getOwnedStudyPlan(
  supabase: StudyPlannerUpdateAdminClient,
  planId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}

export async function getStudySessionsForPlan(
  supabase: StudyPlannerUpdateAdminClient,
  planId: string,
  userId: string,
): Promise<StudyPlannerSessionUpdateRecord[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(STUDY_SESSION_UPDATE_SELECT)
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error('Error al obtener sesiones')
  }

  return data ?? []
}

export async function updateStudySessionTimeWindow(
  supabase: StudyPlannerUpdateAdminClient,
  sessionId: string,
  userId: string,
  startTimeIso: string,
  endTimeIso: string,
): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      start_time: startTimeIso,
      end_time: endTimeIso,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
