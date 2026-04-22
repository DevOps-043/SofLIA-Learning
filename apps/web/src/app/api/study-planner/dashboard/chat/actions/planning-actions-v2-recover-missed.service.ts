import {
  createAdminClient,
  createGoogleCalendarEvent,
  getCalendarAccessToken,
  parseSessionMetrics,
  persistSessionCalendarSync,
  syncSessionWithCalendar,
} from '../calendar.service'
import { getCurrentTimezone } from '../format.utils'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { validateStrictLessonOrder } from './lesson-order-guardrails.service'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'
import { withTimezoneOffset } from './planning-actions-v2-timezone.service'

export async function executeRecoverMissedSessionV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
) {
  const supabase = createAdminClient()
  const {
    sessionId,
    newStartTime,
    newEndTime,
  } = action.data as {
    sessionId: string
    newStartTime: string
    newEndTime: string
  }

  const startTimeISO = withTimezoneOffset(newStartTime)
  const endTimeISO = withTimezoneOffset(newEndTime)
  const placementValidation = await validatePlacementAgainstCalendarRules({
    userId,
    sessionId,
    startTimeIso: startTimeISO,
    endTimeIso: endTimeISO,
    userMessage,
  })

  if (!placementValidation.valid) {
    return { ...action, status: 'error', message: placementValidation.message }
  }

  const orderValidation = await validateStrictLessonOrder({
    userId,
    planId,
    proposedMoves: [{ sessionId, newStartTime: startTimeISO }],
  })

  if (!orderValidation.valid) {
    return {
      ...action,
      status: 'error',
      code: orderValidation.code,
      message: orderValidation.message,
    }
  }

  const { data: originalSession, error: getError } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (getError || !originalSession) {
    return { ...action, status: 'error', message: 'Sesion no encontrada.' }
  }

  const start = new Date(startTimeISO)
  const end = new Date(endTimeISO)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

  const { error: updateError } = await supabase
    .from('study_sessions')
    .update({
      start_time: startTimeISO,
      end_time: endTimeISO,
      duration_minutes: durationMinutes,
      status: 'planned',
    })
    .eq('id', sessionId)

  if (updateError) {
    logger.error('Error recuperando sesion:', updateError)
    return { ...action, status: 'error', message: 'Error al reprogramar la sesion.' }
  }

  if (originalSession.external_event_id) {
    await syncSessionWithCalendar(userId, sessionId, 'update', {
      start_time: startTimeISO,
      end_time: endTimeISO,
    })
  } else {
    const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)
    if (accessToken && provider === 'google') {
      const parsedMetrics = parseSessionMetrics(originalSession.metrics)
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        {
          title: originalSession.title,
          start_time: startTimeISO,
          end_time: endTimeISO,
          description: originalSession.description || '',
          sessionId: originalSession.id,
          planId: originalSession.plan_id,
          clientReferenceId:
            typeof parsedMetrics?.clientReferenceId === 'string'
              ? parsedMetrics.clientReferenceId
              : undefined,
        },
        getCurrentTimezone() || 'America/Mexico_City',
        calendarId,
      )

      if (eventId) {
        await persistSessionCalendarSync({
          supabase,
          sessionId,
          eventId,
          provider: 'google',
          calendarId,
          source: 'manual_action',
          existingSession: originalSession,
        })
      }
    }
  }

  return {
    ...action,
    status: 'success',
    message: `Sesion "${originalSession.title}" reprogramada exitosamente.`,
    data: { sessionId },
  }
}
