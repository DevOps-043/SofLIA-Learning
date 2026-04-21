import { createAdminClient, syncSessionWithCalendar } from '../calendar.service'
import { getCurrentTimezone, getTimezoneOffset } from '../format.utils'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'

export { executeUpdateSessionV2 } from './session-actions-v2-update.service'

function hasTimezoneOffset(timestamp: string): boolean {
  return /[+-]\d{2}:\d{2}$/.test(timestamp) || timestamp.endsWith('Z')
}

export async function executeMoveSessionV2(
  userId: string,
  _planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { sessionId, newStartTime, newEndTime } = action.data as {
    sessionId: string
    newStartTime: string
    newEndTime: string
  }

  logger.info(`Moviendo sesion ${sessionId} a ${newStartTime} - ${newEndTime}`)

  const tzOffset = getTimezoneOffset(getCurrentTimezone())
  const startTimeISO = hasTimezoneOffset(newStartTime)
    ? newStartTime
    : newStartTime + tzOffset
  const endTimeISO = hasTimezoneOffset(newEndTime)
    ? newEndTime
    : newEndTime + tzOffset

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

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
    start_time: startTimeISO,
    end_time: endTimeISO,
  })

  const { error } = await supabase
    .from('study_sessions')
    .update({
      start_time: startTimeISO,
      end_time: endTimeISO,
      was_rescheduled: true,
      rescheduled_from: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    return { ...action, status: 'error', message: `Error al mover la sesion: ${error.message}` }
  }

  const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : ''
  return { ...action, status: 'success', message: `Sesion movida correctamente${calendarMsg}` }
}

export async function executeDeleteSessionV2(
  userId: string,
  _planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { sessionId } = action.data as { sessionId: string }

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'delete')

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    return { ...action, status: 'error', message: `Error al eliminar la sesion: ${error.message}` }
  }

  const calendarMsg = calendarSync.success ? ' y eliminada de tu calendario' : ''
  return { ...action, status: 'success', message: `Sesion eliminada correctamente${calendarMsg}` }
}

export async function executeResizeSessionV2(
  userId: string,
  _planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { sessionId, newDurationMinutes } = action.data as {
    sessionId: string
    newDurationMinutes: number
  }

  const { data: session } = await supabase
    .from('study_sessions')
    .select('start_time')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!session) {
    return { ...action, status: 'error', message: 'Sesion no encontrada' }
  }

  const startTime = new Date(session.start_time)
  const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000)
  const placementValidation = await validatePlacementAgainstCalendarRules({
    userId,
    sessionId,
    startTimeIso: session.start_time,
    endTimeIso: newEndTime.toISOString(),
    userMessage,
  })

  if (!placementValidation.valid) {
    return { ...action, status: 'error', message: placementValidation.message }
  }

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
    start_time: session.start_time,
    end_time: newEndTime.toISOString(),
  })

  const { error } = await supabase
    .from('study_sessions')
    .update({
      end_time: newEndTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    return { ...action, status: 'error', message: `Error al ajustar duracion: ${error.message}` }
  }

  const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : ''
  return { ...action, status: 'success', message: `Duracion ajustada a ${newDurationMinutes} minutos${calendarMsg}` }
}

export async function executeCreateSessionV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { title, startTime, endTime, courseId, lessonId, description } = action.data as {
    title: string
    startTime: string
    endTime: string
    courseId?: string
    lessonId?: string
    description?: string
  }

  const placementValidation = await validatePlacementAgainstCalendarRules({
    userId,
    startTimeIso: startTime,
    endTimeIso: endTime,
    userMessage,
  })

  if (!placementValidation.valid) {
    return { ...action, status: 'error', message: placementValidation.message }
  }

  const { error } = await supabase
    .from('study_sessions')
    .insert({
      plan_id: planId,
      user_id: userId,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      course_id: courseId,
      lesson_id: lessonId,
      status: 'planned',
      is_ai_generated: false,
    })

  if (error) {
    return { ...action, status: 'error', message: `Error al crear sesion: ${error.message}` }
  }
  return { ...action, status: 'success', message: 'Nueva sesion creada correctamente' }
}
