import { logger } from '../../../../../lib/utils/logger'
import type { DeleteSessionData } from './dashboard-action.types'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'

export async function deleteSessionAction(params: {
  data: Partial<DeleteSessionData>
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionId } = params.data

  if (!sessionId) {
    return { ok: false, error: 'sessionId es requerido', status: 400 }
  }

  const { error } = await params.supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', params.userId)

  if (error) {
    logger.error('Error eliminando sesion:', error)
    return { ok: false, error: `Error al eliminar la sesion: ${error.message}`, status: 500 }
  }

  return { ok: true, message: 'Sesion eliminada correctamente' }
}
