import type { Handler } from '@netlify/functions'

import { createAdminClient } from './process-inactive-lessons/client'
import { PROCESSING_BATCH_SIZE } from './process-inactive-lessons/constants'
import { processTracking } from './process-inactive-lessons/process-tracking'
import { errorMessage, jsonResponse } from './process-inactive-lessons/responses'
import { checkAndCloseSession } from './process-inactive-lessons/session-close'
import type { LessonTracking } from './process-inactive-lessons/types'

const handler: Handler = async () => {
  console.log('[Cron] Iniciando process-inactive-lessons...')

  try {
    const supabase = createAdminClient()
    const { data: trackings, error } = await supabase
      .from('lesson_tracking')
      .select('*')
      .eq('status', 'in_progress')
      .lte('next_analysis_at', new Date().toISOString())
      .order('next_analysis_at', { ascending: true })
      .limit(PROCESSING_BATCH_SIZE)

    if (error) {
      console.error('Error obteniendo trackings:', error)
      return jsonResponse(500, { error: error.message })
    }

    if (!trackings || trackings.length === 0) {
      console.log('No hay trackings pendientes de analisis')
      return jsonResponse(200, { message: 'No trackings to process', processed: 0 })
    }

    const result = await processTrackings(supabase, trackings as LessonTracking[])
    console.log(
      `Resultado: ${result.completed} completados, ${result.rescheduled} reprogramados`,
    )

    return jsonResponse(200, {
      message: 'Processing complete',
      processed: trackings.length,
      completed: result.completed,
      rescheduled: result.rescheduled,
    })
  } catch (error) {
    console.error('Error en process-inactive-lessons:', error)
    return jsonResponse(500, { error: errorMessage(error) })
  }
}

async function processTrackings(
  supabase: ReturnType<typeof createAdminClient>,
  trackings: LessonTracking[],
) {
  let completed = 0
  let rescheduled = 0

  for (const tracking of trackings) {
    const result = await processTracking(supabase, tracking)

    if (result.completed) {
      completed += 1
      console.log(`Tracking ${tracking.id} completado: ${result.reason}`)
      if (tracking.session_id && result.reason) {
        await checkAndCloseSession(supabase, tracking.session_id, result.reason)
      }
    } else {
      rescheduled += 1
    }
  }

  return { completed, rescheduled }
}

export { handler }
