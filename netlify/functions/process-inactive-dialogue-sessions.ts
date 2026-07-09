import type { Handler } from '@netlify/functions'

import { createAdminClient } from './process-inactive-dialogue-sessions/client'
import {
  INACTIVITY_THRESHOLD_SECONDS,
  PROCESSING_BATCH_SIZE,
} from './process-inactive-dialogue-sessions/constants'
import { processInactiveDialogueSession } from './process-inactive-dialogue-sessions/process-session'
import { errorMessage, jsonResponse } from './process-inactive-dialogue-sessions/responses'
import type { PendingInactivityCloseSession } from './process-inactive-dialogue-sessions/types'

const handler: Handler = async () => {
  console.log('[Cron] Iniciando process-inactive-dialogue-sessions...')

  try {
    const supabase = createAdminClient()
    const staleBefore = new Date(
      Date.now() - INACTIVITY_THRESHOLD_SECONDS * 1000,
    ).toISOString()

    const { data: sessions, error } = await supabase.rpc(
      'get_dialogue_sessions_pending_inactivity_close',
      { p_stale_before: staleBefore, p_batch_size: PROCESSING_BATCH_SIZE },
    )

    if (error) {
      console.error('Error obteniendo sesiones de dialogo pendientes:', error)
      return jsonResponse(500, { error: error.message })
    }

    const pendingSessions = (sessions ?? []) as PendingInactivityCloseSession[]

    if (pendingSessions.length === 0) {
      console.log('No hay sesiones de dialogo pendientes de cierre por inactividad')
      return jsonResponse(200, { message: 'No sessions to process', processed: 0 })
    }

    const result = await closeSessions(supabase, pendingSessions)
    console.log(`Resultado: ${result.closed} sesiones cerradas, ${result.failed} fallidas`)

    return jsonResponse(200, {
      message: 'Processing complete',
      processed: pendingSessions.length,
      closed: result.closed,
      failed: result.failed,
    })
  } catch (error) {
    console.error('Error en process-inactive-dialogue-sessions:', error)
    return jsonResponse(500, { error: errorMessage(error) })
  }
}

async function closeSessions(
  supabase: ReturnType<typeof createAdminClient>,
  sessions: PendingInactivityCloseSession[],
) {
  let closed = 0
  let failed = 0

  for (const session of sessions) {
    try {
      const { activeSeconds } = await processInactiveDialogueSession(supabase, session)
      closed += 1
      console.log(
        `Sesion ${session.session_id} cerrada por inactividad: ${activeSeconds}s activos`,
      )
    } catch (error) {
      failed += 1
      console.error(`Error cerrando sesion ${session.session_id}:`, errorMessage(error))
    }
  }

  return { closed, failed }
}

export { handler }
