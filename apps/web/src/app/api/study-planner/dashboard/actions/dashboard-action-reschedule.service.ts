import { logger } from '../../../../../lib/utils/logger'
import type { RescheduleSessionsData, RescheduleSessionItem } from './dashboard-action.types'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'

export async function rescheduleSessionsAction(params: {
  data: Partial<RescheduleSessionsData>
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { sessionIds, newSchedule } = params.data

  if (!sessionIds || !Array.isArray(sessionIds) || !newSchedule) {
    return { ok: false, error: 'sessionIds y newSchedule son requeridos', status: 400 }
  }

  const now = new Date().toISOString()
  const updatePromises = newSchedule.map((item: RescheduleSessionItem) =>
    params.supabase
      .from('study_sessions')
      .update({
        start_time: item.newStartTime,
        end_time: item.newEndTime,
        was_rescheduled: true,
        rescheduled_from: now,
        updated_at: now,
      })
      .eq('id', item.sessionId)
      .eq('user_id', params.userId),
  )

  const results = await Promise.allSettled(updatePromises)
  let successCount = 0
  let errorCount = 0

  for (const result of results) {
    if (result.status === 'fulfilled' && !result.value.error) {
      successCount += 1
      continue
    }

    errorCount += 1
    if (result.status === 'rejected') {
      logger.error('Error reprogramando sesion:', result.reason)
    } else if (result.value.error) {
      logger.error('Error reprogramando sesion:', result.value.error)
    }
  }

  return {
    ok: errorCount === 0,
    message: `${successCount} sesiones reprogramadas${errorCount > 0 ? `, ${errorCount} fallaron` : ''}`,
  }
}
