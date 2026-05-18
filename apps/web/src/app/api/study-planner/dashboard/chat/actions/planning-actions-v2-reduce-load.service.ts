import {
  createAdminClient,
  deleteGoogleCalendarEvent,
  getCalendarAccessToken,
  syncSessionWithCalendar,
} from '../calendar.service'
import type { ActionResult } from '../types'
import { validateStrictLessonOrder } from './lesson-order-guardrails.service'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'
import { hasTimezoneOffset, withTimezoneOffset } from './planning-actions-v2-timezone.service'

const RESIZABLE_SESSION_SELECT = 'id, start_time'

export async function executeReduceSessionLoadV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
) {
  const supabase = createAdminClient()
  const { date, sessionsToReduce } = action.data as {
    date?: string
    sessionsToReduce?: Array<{
      sessionId: string
      reduceAction: 'delete' | 'resize' | 'move'
      newData?: {
        durationMinutes?: number
        startTime?: string
        endTime?: string
      }
    }>
  }

  if (!sessionsToReduce || sessionsToReduce.length === 0) {
    return {
      ...action,
      status: 'error',
      message: 'No se especificaron sesiones para reducir.',
    }
  }

  const reduceResults: Array<{ sessionId: string; action: string; success: boolean }> = []
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)

  for (const sessionAction of sessionsToReduce) {
    const { sessionId, reduceAction, newData } = sessionAction

    if (reduceAction === 'delete') {
      const { data: session } = await supabase
        .from('study_sessions')
        .select('external_event_id')
        .eq('id', sessionId)
        .single()

      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)

      if (!error) {
        reduceResults.push({ sessionId, action: 'deleted', success: true })
        if (accessToken && provider === 'google' && session?.external_event_id) {
          await deleteGoogleCalendarEvent(accessToken, session.external_event_id, calendarId)
        }
      } else {
        reduceResults.push({ sessionId, action: 'deleted', success: false })
      }
      continue
    }

    if (reduceAction === 'resize' && newData?.durationMinutes) {
      const { data: session } = await supabase
        .from('study_sessions')
        .select(RESIZABLE_SESSION_SELECT)
        .eq('id', sessionId)
        .single()

      if (!session) {
        reduceResults.push({ sessionId, action: 'resized', success: false })
        continue
      }

      const startTimeISO = hasTimezoneOffset(session.start_time)
        ? session.start_time
        : withTimezoneOffset(session.start_time)
      const startTime = new Date(startTimeISO)
      const newEndTime = new Date(startTime.getTime() + newData.durationMinutes * 60 * 1000)
      const endTimeISO = newEndTime.toISOString()

      const placementValidation = await validatePlacementAgainstCalendarRules({
        userId,
        sessionId,
        startTimeIso: startTimeISO,
        endTimeIso: endTimeISO,
        userMessage,
      })

      if (!placementValidation.valid) {
        reduceResults.push({ sessionId, action: 'resized', success: false })
        continue
      }

      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: endTimeISO,
          duration_minutes: newData.durationMinutes,
        })
        .eq('id', sessionId)

      if (!error) {
        reduceResults.push({ sessionId, action: 'resized', success: true })
        await syncSessionWithCalendar(userId, sessionId, 'update', {
          start_time: startTimeISO,
          end_time: endTimeISO,
        })
      } else {
        reduceResults.push({ sessionId, action: 'resized', success: false })
      }
      continue
    }

    if (reduceAction === 'move' && newData?.startTime && newData?.endTime) {
      const startTimeISO = withTimezoneOffset(newData.startTime)
      const endTimeISO = withTimezoneOffset(newData.endTime)
      const placementValidation = await validatePlacementAgainstCalendarRules({
        userId,
        sessionId,
        startTimeIso: startTimeISO,
        endTimeIso: endTimeISO,
        userMessage,
      })

      if (!placementValidation.valid) {
        reduceResults.push({ sessionId, action: 'moved', success: false })
        continue
      }

      const orderValidation = await validateStrictLessonOrder({
        userId,
        planId,
        proposedMoves: [{ sessionId, newStartTime: startTimeISO }],
      })

      if (!orderValidation.valid) {
        reduceResults.push({ sessionId, action: 'moved', success: false })
        continue
      }

      const start = new Date(startTimeISO)
      const end = new Date(endTimeISO)
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

      const { error } = await supabase
        .from('study_sessions')
        .update({
          start_time: startTimeISO,
          end_time: endTimeISO,
          duration_minutes: durationMinutes,
        })
        .eq('id', sessionId)

      if (!error) {
        reduceResults.push({ sessionId, action: 'moved', success: true })
        await syncSessionWithCalendar(userId, sessionId, 'update', {
          start_time: startTimeISO,
          end_time: endTimeISO,
        })
      } else {
        reduceResults.push({ sessionId, action: 'moved', success: false })
      }
    }
  }

  const reduceSuccessCount = reduceResults.filter((result) => result.success).length

  return {
    ...action,
    status: reduceSuccessCount > 0 ? 'success' : 'error',
    message: `Carga del ${date || 'dia'} reducida: ${reduceSuccessCount}/${sessionsToReduce.length} cambios aplicados.`,
    data: { results: reduceResults },
  }
}
