import { DatabaseError, ForbiddenError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import type { Database } from '@/core/supabase/database.types'
import { getServiceClient } from '@/core/supabase/service-client'

import { buildSessionUpdatePayload } from './study-planner.utils'
import type {
  CreatePlanInput,
  CreateSessionInput,
  NormalizedSessionListQuery,
  StudyPlan,
  StudySession,
  UpdateSessionInput,
} from './study-planner.types'

type StudySessionRow = Database['public']['Tables']['study_sessions']['Row']
type StudyPlanRow = Database['public']['Tables']['study_plans']['Row']

function toDailyStudyMinutes(goalHoursPerWeek: number | null): number | null {
  if (!goalHoursPerWeek) {
    return null
  }

  return Math.round((goalHoursPerWeek * 60) / 7)
}

function toGoalHoursPerWeek(dailyStudyMinutes?: number): number {
  if (!dailyStudyMinutes) {
    return 7
  }

  return Math.max(1, Math.round((dailyStudyMinutes * 7) / 60))
}

function mapStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_id: row.plan_id,
    course_id: row.course_id,
    title: row.title,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status as StudySession['status'],
    notes: row.notes,
    external_event_id: row.external_event_id,
    calendar_provider: row.calendar_provider,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapStudyPlan(row: StudyPlanRow): StudyPlan {
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_ids?.[0] ?? null,
    title: row.name,
    start_date: row.start_date ?? '',
    end_date: row.end_date ?? '',
    daily_study_minutes: toDailyStudyMinutes(row.goal_hours_per_week),
    is_active: row.end_date ? row.end_date >= today : true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export interface StudyPlannerRepository {
  findSessions(
    userId: string,
    query: NormalizedSessionListQuery,
  ): Promise<{ sessions: StudySession[]; total: number }>
  findSessionById(sessionId: string, userId: string): Promise<StudySession>
  createSession(userId: string, data: CreateSessionInput): Promise<StudySession>
  updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionInput,
  ): Promise<StudySession>
  deleteSession(sessionId: string, userId: string): Promise<void>
  findPlans(userId: string): Promise<StudyPlan[]>
  findPlanById(planId: string, userId: string): Promise<StudyPlan>
  createPlan(userId: string, data: CreatePlanInput): Promise<StudyPlan>
}

export class SupabaseStudyPlannerRepository implements StudyPlannerRepository {
  async findSessions(
    userId: string,
    query: NormalizedSessionListQuery,
  ): Promise<{ sessions: StudySession[]; total: number }> {
    const supabase = getServiceClient()

    let q = supabase
      .from('study_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (query.planId) q = q.eq('plan_id', query.planId)
    if (query.status) q = q.eq('status', query.status)
    if (query.startDate) q = q.gte('start_time', query.startDate)
    if (query.endDate) q = q.lte('end_time', query.endDate)

    q = q
      .order(query.orderBy, { ascending: query.orderDirection === 'asc' })
      .range(query.offset, query.offset + query.limit - 1)

    const { data, error, count } = await q

    if (error) {
      logger.error('Error fetching study sessions', { error: error.message })
      throw new DatabaseError('Error al obtener sesiones de estudio')
    }

    return {
      sessions: (data ?? []).map((session) => mapStudySession(session)),
      total: count ?? 0,
    }
  }

  async findSessionById(sessionId: string, userId: string): Promise<StudySession> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle()

    if (error || !data) {
      throw new NotFoundError('Sesion de estudio no encontrada')
    }

    if (data.user_id !== userId) {
      throw new ForbiddenError()
    }

    return mapStudySession(data)
  }

  async createSession(userId: string, data: CreateSessionInput): Promise<StudySession> {
    const supabase = getServiceClient()
    const now = new Date().toISOString()

    const payload: Database['public']['Tables']['study_sessions']['Insert'] = {
      user_id: userId,
      plan_id: data.planId,
      course_id: data.courseId ?? null,
      title: data.title,
      start_time: data.startTime,
      end_time: data.endTime,
      status: 'planned',
      notes: data.notes ?? null,
      created_at: now,
      updated_at: now,
    }

    const { data: result, error } = await supabase
      .from('study_sessions')
      .insert(payload)
      .select('*')
      .single()

    if (error || !result) {
      logger.error('Error creating study session', { error: error?.message })
      throw new DatabaseError('Error al crear sesion de estudio')
    }

    return mapStudySession(result)
  }

  async updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionInput,
  ): Promise<StudySession> {
    const supabase = getServiceClient()
    await this.findSessionById(sessionId, userId)

    const patch = buildSessionUpdatePayload(data)

    const { data: result, error } = await supabase
      .from('study_sessions')
      .update(patch)
      .eq('id', sessionId)
      .select('*')
      .single()

    if (error || !result) {
      logger.error('Error updating study session', { error: error?.message })
      throw new DatabaseError('Error al actualizar sesion de estudio')
    }

    return mapStudySession(result)
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const supabase = getServiceClient()
    await this.findSessionById(sessionId, userId)

    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      logger.error('Error deleting study session', { error: error.message })
      throw new DatabaseError('Error al eliminar sesion de estudio')
    }
  }

  async findPlans(userId: string): Promise<StudyPlan[]> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching study plans', { error: error.message })
      throw new DatabaseError('Error al obtener planes de estudio')
    }

    return (data ?? []).map((plan) => mapStudyPlan(plan))
  }

  async findPlanById(planId: string, userId: string): Promise<StudyPlan> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle()

    if (error || !data) {
      throw new NotFoundError('Plan de estudio no encontrado')
    }

    if (data.user_id !== userId) {
      throw new ForbiddenError()
    }

    return mapStudyPlan(data)
  }

  async createPlan(userId: string, data: CreatePlanInput): Promise<StudyPlan> {
    const supabase = getServiceClient()
    const now = new Date().toISOString()

    const payload: Database['public']['Tables']['study_plans']['Insert'] = {
      user_id: userId,
      name: data.title,
      course_ids: data.courseId ? [data.courseId] : [],
      start_date: data.startDate,
      end_date: data.endDate,
      goal_hours_per_week: toGoalHoursPerWeek(data.dailyStudyMinutes),
      timezone: 'UTC',
      preferred_days: [],
      created_at: now,
      updated_at: now,
    }

    const { data: result, error } = await supabase
      .from('study_plans')
      .insert(payload)
      .select('*')
      .single()

    if (error || !result) {
      logger.error('Error creating study plan', { error: error?.message })
      throw new DatabaseError('Error al crear plan de estudio')
    }

    return mapStudyPlan(result)
  }
}
