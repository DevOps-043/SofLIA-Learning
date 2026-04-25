import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import {
  createAdminClient,
  createGoogleCalendarEvent,
  getCalendarAccessToken,
  persistSessionCalendarSync,
} from '../calendar.service'

type ResyncSessionRow = {
  description: string | null
  end_time: string
  id: string
  metrics: unknown
  plan_id: string
  start_time: string
  title: string
}

export async function executeResyncCalendarSessions(
  userId: string,
  planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const { sessionIds } = (action.data || {}) as { sessionIds?: string[] }
  if (!sessionIds?.length) {
    return {
      ...action,
      status: 'error',
      message: 'No se especificaron sesiones para resincronizar.',
    }
  }

  const supabase = createAdminClient()
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)
  if (!accessToken || provider !== 'google') {
    return {
      ...action,
      status: 'error',
      message: 'No hay una conexión activa con Google Calendar para resincronizar estas sesiones.',
    }
  }

  const { data: plan } = await supabase
    .from('study_plans')
    .select('timezone')
    .eq('id', planId)
    .eq('user_id', userId)
    .single()

  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, title, description, start_time, end_time, plan_id, metrics')
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .in('id', sessionIds)

  if (error || !sessions?.length) {
    return {
      ...action,
      status: 'error',
      message: 'No encontré sesiones autorizadas para resincronizar.',
    }
  }

  const results: Array<{ sessionId: string; success: boolean }> = []
  for (const session of sessions as ResyncSessionRow[]) {
    const eventId = await createGoogleCalendarEvent(
      accessToken,
      {
        title: session.title,
        description: session.description || '',
        start_time: session.start_time,
        end_time: session.end_time,
        sessionId: session.id,
        planId: session.plan_id,
      },
      plan?.timezone || 'America/Mexico_City',
      calendarId,
    ).catch((error) => {
      logger.error('Error recreando evento de calendario:', error)
      return null
    })

    if (!eventId) {
      results.push({ sessionId: session.id, success: false })
      continue
    }

    await persistSessionCalendarSync({
      supabase,
      sessionId: session.id,
      eventId,
      provider: 'google',
      calendarId,
      source: 'resync',
      existingSession: session,
    })

    results.push({ sessionId: session.id, success: true })
  }

  const successCount = results.filter((result) => result.success).length
  return {
    ...action,
    status: successCount > 0 ? 'success' : 'error',
    message:
      successCount > 0
        ? `Resincronicé ${successCount}/${sessions.length} sesiones con Google Calendar.`
        : 'No pude recrear los eventos de Google Calendar para estas sesiones.',
    data: { results, sessionsResynced: successCount },
  }
}
