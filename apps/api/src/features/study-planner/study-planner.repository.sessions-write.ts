import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import type { Database } from '@/core/supabase/database.types'

import { mapStudySession } from './study-planner.mappers'
import { findSessionById } from './study-planner.repository.sessions-read'
import { buildSessionUpdatePayload } from './study-planner.utils'
import type { StudyPlannerDbClient } from './study-planner.repository.contract'
import type { CreateSessionInput, UpdateSessionInput } from './study-planner.types'

export async function createSession(
  client: StudyPlannerDbClient,
  userId: string,
  data: CreateSessionInput,
) {
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

  const { data: result, error } = await client
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

export async function updateSession(
  client: StudyPlannerDbClient,
  sessionId: string,
  userId: string,
  data: UpdateSessionInput,
) {
  await findSessionById(client, sessionId, userId)

  const { data: result, error } = await client
    .from('study_sessions')
    .update(buildSessionUpdatePayload(data))
    .eq('id', sessionId)
    .select('*')
    .single()

  if (error || !result) {
    logger.error('Error updating study session', { error: error?.message })
    throw new DatabaseError('Error al actualizar sesion de estudio')
  }

  return mapStudySession(result)
}

export async function deleteSession(
  client: StudyPlannerDbClient,
  sessionId: string,
  userId: string,
) {
  await findSessionById(client, sessionId, userId)

  const { error } = await client.from('study_sessions').delete().eq('id', sessionId)

  if (error) {
    logger.error('Error deleting study session', { error: error.message })
    throw new DatabaseError('Error al eliminar sesion de estudio')
  }
}
