import { logger } from '../../../../../lib/utils/logger'
import type { MoveSessionData } from './dashboard-action.types'
import {
  findPlannedSessionConflicts,
  type DashboardActionSupabaseClient,
} from './dashboard-action-db.service'

export async function moveSessionAction(params: {
  data: Partial<MoveSessionData>
  planId: string
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionId, newStartTime, newEndTime } = params.data

  if (!sessionId || !newStartTime || !newEndTime) {
    return { ok: false, error: 'sessionId, newStartTime y newEndTime son requeridos', status: 400 }
  }

  const conflicts = await findPlannedSessionConflicts({
    supabase: params.supabase,
    planId: params.planId,
    excludeSessionId: sessionId,
    startTime: newStartTime,
    endTime: newEndTime,
  })

  if (conflicts.length > 0) {
    return {
      ok: false,
      error: `Conflicto con sesion existente: "${conflicts[0].title}"`,
      status: 400,
    }
  }

  const { error } = await params.supabase
    .from('study_sessions')
    .update({
      start_time: newStartTime,
      end_time: newEndTime,
      was_rescheduled: true,
      rescheduled_from: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', params.userId)

  if (error) {
    logger.error('Error moviendo sesion:', error)
    return { ok: false, error: `Error al mover la sesion: ${error.message}`, status: 500 }
  }

  return { ok: true, message: 'Sesion movida correctamente' }
}
