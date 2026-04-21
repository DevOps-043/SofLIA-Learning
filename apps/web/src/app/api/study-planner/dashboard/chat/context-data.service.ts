import { logger } from '../../../../../lib/utils/logger'
import { createAdminClient } from './calendar.service'
import type {
  StudyPlanReference,
  StudyPlanRow,
  StudySessionRow,
} from './context-data.types'

type AdminClient = ReturnType<typeof createAdminClient>

export async function loadStudyPlan(
  supabase: AdminClient,
  userId: string,
  planId: string,
  tracePrefix: string,
): Promise<StudyPlanRow | null> {
  const { data: rawPlan, error } = await supabase
    .from('study_plans')
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      timezone,
      preferred_days
    `)
    .eq('user_id', userId)
    .eq('id', planId)
    .single()

  if (error) {
    logger.warn(`${tracePrefix} error fetching active plan`, error)
  }

  return (rawPlan as StudyPlanRow | null) ?? null
}

export async function loadStudyPlanReferences(
  supabase: AdminClient,
  userId: string,
  tracePrefix: string,
): Promise<StudyPlanReference[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('id, name')
    .eq('user_id', userId)

  if (error) {
    logger.warn(`${tracePrefix} failed to load plan references`, error)
  }

  return (data || []) as StudyPlanReference[]
}

export async function loadStudySessionsForPlans(
  supabase: AdminClient,
  planIds: string[],
  rangeStart: Date,
  rangeEnd: Date,
  tracePrefix: string,
): Promise<StudySessionRow[]> {
  if (planIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      duration_minutes,
      status,
      course_id,
      lesson_id,
      external_event_id,
      calendar_provider,
      plan_id,
      metrics
    `)
    .in('plan_id', planIds)
    .gte('start_time', rangeStart.toISOString())
    .lte('start_time', rangeEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    logger.warn(`${tracePrefix} failed to load study sessions`, error)
  }

  return (data || []) as StudySessionRow[]
}
