import { logger } from '../../../../../lib/utils/logger'
import type {
  StudySessionUpdateFields,
  UpdateSessionData,
} from './dashboard-action.types'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'

const ALLOWED_FIELDS: Array<keyof StudySessionUpdateFields> = ['title', 'description', 'notes']

export async function updateSessionAction(params: {
  data: Partial<UpdateSessionData>
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionId, ...updates } = params.data

  if (!sessionId) {
    return { ok: false, error: 'sessionId es requerido', status: 400 }
  }

  const filteredUpdates: StudySessionUpdateFields = {}
  for (const key of ALLOWED_FIELDS) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key]
    }
  }

  if (!Object.keys(filteredUpdates).length) {
    return { ok: false, error: 'No hay campos validos para actualizar', status: 400 }
  }

  const { error } = await params.supabase
    .from('study_sessions')
    .update({
      ...filteredUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', params.userId)

  if (error) {
    logger.error('Error actualizando sesion:', error)
    return { ok: false, error: `Error al actualizar sesion: ${error.message}`, status: 500 }
  }

  return { ok: true, message: 'Sesion actualizada correctamente' }
}
