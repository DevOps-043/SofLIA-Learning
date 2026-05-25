import { DatabaseError, ForbiddenError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'

import { mapStudySession } from './study-planner.mappers'
import type { StudyPlannerDbClient } from './study-planner.repository.contract'
import type { NormalizedSessionListQuery, StudySession } from './study-planner.types'

export async function findSessions(
  client: StudyPlannerDbClient,
  userId: string,
  query: NormalizedSessionListQuery,
): Promise<{ sessions: StudySession[]; total: number }> {
  let sessionQuery = client
    .from('study_sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (query.planId) sessionQuery = sessionQuery.eq('plan_id', query.planId)
  if (query.status) sessionQuery = sessionQuery.eq('status', query.status)
  if (query.startDate) {
    sessionQuery = sessionQuery.gte('start_time', query.startDate)
  }
  if (query.endDate) sessionQuery = sessionQuery.lte('end_time', query.endDate)

  const { data, error, count } = await sessionQuery
    .order(query.orderBy, { ascending: query.orderDirection === 'asc' })
    .range(query.offset, query.offset + query.limit - 1)

  if (error) {
    logger.error('Error fetching study sessions', { error: error.message })
    throw new DatabaseError('Error al obtener sesiones de estudio')
  }

  return {
    sessions: (data ?? []).map((session) => mapStudySession(session)),
    total: count ?? 0,
  }
}

export async function findSessionById(
  client: StudyPlannerDbClient,
  sessionId: string,
  userId: string,
) {
  const { data, error } = await client
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
