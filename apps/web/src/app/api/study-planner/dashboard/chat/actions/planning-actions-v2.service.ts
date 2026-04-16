import {
  createAdminClient,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getCalendarAccessToken,
  syncSessionWithCalendar,
} from '../calendar.service'
import { getCurrentTimezone } from '../format.utils'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'
import {
  executeUpdateCalendarSelection,
} from './planning-actions.service'

const DEFAULT_TZ_OFFSET = '-06:00'

function hasTimezoneOffset(timestamp: string): boolean {
  return (
    timestamp.includes('+')
    || timestamp.includes('Z')
    || /-\d{2}:\d{2}$/.test(timestamp)
  )
}

function withTimezoneOffset(timestamp: string): string {
  if (hasTimezoneOffset(timestamp)) {
    return timestamp
  }

  return `${timestamp}${DEFAULT_TZ_OFFSET}`
}

export async function executeCreateMicroSessionV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
) {
  const supabase = createAdminClient()
  const { title, startTime, endTime, type } = action.data as {
    title?: string
    startTime: string
    endTime: string
    type?: string
  }

  const startTimeISO = withTimezoneOffset(startTime)
  const endTimeISO = withTimezoneOffset(endTime)
  const start = new Date(startTimeISO)
  const end = new Date(endTimeISO)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

  if (durationMinutes > 45) {
    return {
      ...action,
      status: 'error',
      message: 'Las micro-sesiones deben ser de maximo 45 minutos.',
    }
  }

  const placementValidation = await validatePlacementAgainstCalendarRules({
    userId,
    startTimeIso: startTimeISO,
    endTimeIso: endTimeISO,
    userMessage,
  })

  if (!placementValidation.valid) {
    return { ...action, status: 'error', message: placementValidation.message }
  }

  const sessionTitle = title || `Micro-sesion de ${type || 'repaso rapido'}`
  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      plan_id: planId,
      title: sessionTitle,
      description: `Micro-sesion de ${type || 'repaso rapido'} (${durationMinutes} min)`,
      start_time: startTimeISO,
      end_time: endTimeISO,
      duration_minutes: durationMinutes,
      status: 'planned',
    })
    .select()
    .single()

  if (error || !session) {
    logger.error('Error creando micro-sesion:', error)
    return { ...action, status: 'error', message: 'Error al crear la micro-sesion.' }
  }

  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)
  if (accessToken && provider === 'google') {
    const eventId = await createGoogleCalendarEvent(
      accessToken,
      {
        title: sessionTitle,
        start_time: startTimeISO,
        end_time: endTimeISO,
        description: session.description || '',
      },
      getCurrentTimezone() || 'America/Mexico_City',
      calendarId,
    )

    if (eventId) {
      await supabase
        .from('study_sessions')
        .update({ external_event_id: eventId })
        .eq('id', session.id)
    }
  }

  return {
    ...action,
    status: 'success',
    message: `Micro-sesion de ${durationMinutes} minutos creada: "${sessionTitle}"`,
    data: { sessionId: session.id },
  }
}

export async function executeRecoverMissedSessionV2(
  userId: string,
  _planId: string,
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
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        {
          title: originalSession.title,
          start_time: startTimeISO,
          end_time: endTimeISO,
          description: originalSession.description || '',
        },
        getCurrentTimezone() || 'America/Mexico_City',
        calendarId,
      )

      if (eventId) {
        await supabase
          .from('study_sessions')
          .update({ external_event_id: eventId })
          .eq('id', sessionId)
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

export async function executeRebalancePlanV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  let { sessionsToMove } = (action.data || {}) as {
    sessionsToMove?: Array<{
      sessionId: string
      newStartTime: string
      newEndTime: string
    }>
  }

  if (!sessionsToMove || sessionsToMove.length === 0) {
    return {
      ...action,
      status: 'error',
      message: 'No se especificaron sesiones para rebalancear de forma segura.',
    }
  }

  const results: Array<{ sessionId: string; success: boolean }> = []
  const appliedIds = new Set<string>()

  for (const sessionMove of sessionsToMove) {
    const startTimeISO = withTimezoneOffset(sessionMove.newStartTime)
    const endTimeISO = withTimezoneOffset(sessionMove.newEndTime)

    if (appliedIds.has(sessionMove.sessionId)) {
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    const placementValidation = await validatePlacementAgainstCalendarRules({
      userId,
      sessionId: sessionMove.sessionId,
      startTimeIso: startTimeISO,
      endTimeIso: endTimeISO,
      userMessage,
    })

    if (!placementValidation.valid) {
      logger.warn(
        `Rebalance rechazado para ${sessionMove.sessionId}: ${placementValidation.message}`,
      )
      results.push({ sessionId: sessionMove.sessionId, success: false })
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
      .eq('id', sessionMove.sessionId)
      .eq('plan_id', planId)

    if (error) {
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    await syncSessionWithCalendar(userId, sessionMove.sessionId, 'update', {
      start_time: startTimeISO,
      end_time: endTimeISO,
    })

    appliedIds.add(sessionMove.sessionId)
    results.push({ sessionId: sessionMove.sessionId, success: true })
  }

  const successCount = results.filter((result) => result.success).length

  return {
    ...action,
    status: successCount > 0 ? 'success' : 'error',
    message:
      successCount > 0
        ? `Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones reprogramadas sin violar las reglas del calendario.`
        : 'No se pudieron reprogramar las sesiones sin violar las reglas de trabajo/calendario.',
    data: { results, sessionsRebalanced: successCount },
  }
}

export async function executeReduceSessionLoadV2(
  userId: string,
  _planId: string,
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
        .select('*')
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

export { executeUpdateCalendarSelection }
