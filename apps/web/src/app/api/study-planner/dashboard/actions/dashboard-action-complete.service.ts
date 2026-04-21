import { logger } from '../../../../../lib/utils/logger'
import type { CompleteSessionData } from './dashboard-action.types'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'

export async function completeSessionAction(params: {
  data: Partial<CompleteSessionData>
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionId, selfEvaluation, notes } = params.data

  if (!sessionId) {
    return { ok: false, error: 'sessionId es requerido', status: 400 }
  }

  const { error } = await params.supabase
    .from('study_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      self_evaluation: selfEvaluation,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', params.userId)

  if (error) {
    logger.error('Error completando sesion:', error)
    return { ok: false, error: `Error al completar sesion: ${error.message}`, status: 500 }
  }

  return { ok: true, message: 'Sesion completada. Buen trabajo' }
}
