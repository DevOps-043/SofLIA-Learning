import { logger } from '../../../../../lib/utils/logger'
import type { CreateSessionData } from './dashboard-action.types'
import {
  findPlannedSessionConflicts,
  type DashboardActionSupabaseClient,
} from './dashboard-action-db.service'

export async function createSessionAction(params: {
  data: Partial<CreateSessionData>
  planId: string
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const {
    title,
    startTime,
    endTime,
    courseId,
    lessonId,
    description,
  } = params.data

  if (!title || !startTime || !endTime) {
    return { ok: false, error: 'title, startTime y endTime son requeridos', status: 400 }
  }

  const conflicts = await findPlannedSessionConflicts({
    supabase: params.supabase,
    planId: params.planId,
    startTime,
    endTime,
  })

  if (conflicts.length > 0) {
    return {
      ok: false,
      error: `Conflicto con sesion existente: "${conflicts[0].title}"`,
      status: 400,
    }
  }

  const { data: newSession, error } = await params.supabase
    .from('study_sessions')
    .insert({
      plan_id: params.planId,
      user_id: params.userId,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      course_id: courseId,
      lesson_id: lessonId,
      status: 'planned',
      is_ai_generated: false,
    })
    .select('id')
    .single()

  if (error || !newSession) {
    logger.error('Error creando sesion:', error)
    return { ok: false, error: `Error al crear sesion: ${error?.message || 'Desconocido'}`, status: 500 }
  }

  return {
    ok: true,
    message: 'Nueva sesion creada correctamente',
    data: { sessionId: newSession.id },
  }
}
