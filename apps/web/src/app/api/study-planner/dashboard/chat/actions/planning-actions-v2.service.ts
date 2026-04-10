import {
  createAdminClient,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getCalendarAccessToken,
  parseSessionMetrics,
  persistSessionCalendarSync,
  resolveSessionCalendarSync,
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
        sessionId: session.id,
        planId: session.plan_id,
      },
      getCurrentTimezone() || 'America/Mexico_City',
      calendarId,
    )

    if (eventId) {
      await persistSessionCalendarSync({
        supabase,
        sessionId: session.id,
        eventId,
        provider: 'google',
        calendarId,
        source: 'manual_action',
        existingSession: session,
      })
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
          sessionId: originalSession.id,
          planId: originalSession.plan_id,
          clientReferenceId:
            typeof parseSessionMetrics(originalSession.metrics)?.clientReferenceId === 'string'
              ? parseSessionMetrics(originalSession.metrics)?.clientReferenceId
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

/**
 * Elimina el plan completo: eventos del calendario externo, todas las sesiones y el registro del plan.
 * Llamado cuando SofLIA recibe instrucción explícita del usuario de eliminar su plan.
 *
 * Seguridad: verifica que el plan pertenece al userId antes de borrar cualquier dato.
 */
export async function executeDeletePlan(
  userId: string,
  planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const supabase = createAdminClient()

  // Ownership check: el plan debe pertenecer al usuario
  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', userId)
    .single()

  if (planError || !plan) {
    logger.error('executeDeletePlan: plan not found or unauthorized', { planId, userId })
    return { ...action, status: 'error', message: 'Plan no encontrado o no autorizado.' }
  }

  // Obtener sesiones con evento externo para borrar del calendario
  const { data: sessionsWithEvents } = await supabase
    .from('study_sessions')
    .select('id, external_event_id, calendar_provider, metrics')
    .eq('plan_id', planId)

  // Borrar eventos del calendario (best-effort, no falla si el evento ya no existe)
  let deletedCalendarEvents = 0
  let calendarDeletionErrors = 0
  if (sessionsWithEvents && sessionsWithEvents.length > 0) {
    const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)

    if (accessToken && provider === 'google') {
      const deletionResults = await Promise.allSettled(
        sessionsWithEvents
          .filter((s) =>
            Boolean(
              resolveSessionCalendarSync({
                externalEventId: s.external_event_id,
                calendarProvider: s.calendar_provider,
                metrics: s.metrics,
              })?.externalEventId || s.external_event_id,
            ),
          )
          .map((s) => {
            const calendarSync = resolveSessionCalendarSync({
              externalEventId: s.external_event_id,
              calendarProvider: s.calendar_provider,
              metrics: s.metrics,
            })

            return deleteGoogleCalendarEvent(
              accessToken,
              calendarSync?.externalEventId || s.external_event_id!,
              calendarSync?.calendarId || calendarId,
              s.id,
            )
          }),
      )

      for (const deletionResult of deletionResults) {
        if (deletionResult.status === 'fulfilled' && deletionResult.value) {
          deletedCalendarEvents += 1
        } else {
          calendarDeletionErrors += 1
        }
      }
    }
  }

  // Limpiar tablas dependientes que bloquean el borrado por falta de ON DELETE CASCADE
  await Promise.allSettled([
    supabase.from('calendar_sync_history').delete().eq('plan_id', planId),
    supabase.from('lesson_tracking').delete().eq('plan_id', planId),
  ])

  // Borrar todas las sesiones del plan
  const { error: sessionsError, count: deletedSessions } = await supabase
    .from('study_sessions')
    .delete({ count: 'exact' })
    .eq('plan_id', planId)

  if (sessionsError) {
    logger.error('executeDeletePlan: error deleting sessions', sessionsError)
    return { ...action, status: 'error', message: 'Error al eliminar las sesiones del plan.' }
  }

  // Borrar el plan
  const { error: planDeleteError } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', planId)

  if (planDeleteError) {
    logger.error('executeDeletePlan: error deleting plan', planDeleteError)
    return { ...action, status: 'error', message: 'Error al eliminar el plan de estudios.' }
  }

  logger.info(`executeDeletePlan: plan ${planId} deleted (${deletedSessions ?? 0} sessions)`)

  return {
    ...action,
    status: calendarDeletionErrors === 0 ? 'success' : 'error',
    message:
      calendarDeletionErrors === 0
        ? `Plan de estudios eliminado. ${deletedSessions ?? 0} sesión(es) removida(s) del calendario y la base de datos. Ya puedes crear un nuevo plan para este taller.`
        : `El plan se eliminó de la base de datos, pero quedaron ${calendarDeletionErrors} evento(s) pendientes en Google Calendar.`,
    data: {
      deletedSessions: deletedSessions ?? 0,
      deletedCalendarEvents,
      calendarDeletionErrors,
    },
  }
}

