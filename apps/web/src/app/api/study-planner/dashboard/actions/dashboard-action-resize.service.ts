import { logger } from '../../../../../lib/utils/logger'
import type { ResizeSessionData } from './dashboard-action.types'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'

export async function resizeSessionAction(params: {
  data: Partial<ResizeSessionData>
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionId, newDurationMinutes } = params.data

  if (!sessionId || !newDurationMinutes) {
    return { ok: false, error: 'sessionId y newDurationMinutes son requeridos', status: 400 }
  }

  if (newDurationMinutes < 5 || newDurationMinutes > 180) {
    return { ok: false, error: 'La duracion debe estar entre 5 y 180 minutos', status: 400 }
  }

  const { data: session } = await params.supabase
    .from('study_sessions')
    .select('start_time')
    .eq('id', sessionId)
    .eq('user_id', params.userId)
    .single()

  if (!session) {
    return { ok: false, error: 'Sesion no encontrada', status: 404 }
  }

  const startTime = new Date(session.start_time)
  const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000)

  const { error } = await params.supabase
    .from('study_sessions')
    .update({
      end_time: newEndTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', params.userId)

  if (error) {
    logger.error('Error ajustando duracion:', error)
    return { ok: false, error: `Error al ajustar duracion: ${error.message}`, status: 500 }
  }

  return { ok: true, message: `Duracion ajustada a ${newDurationMinutes} minutos` }
}
