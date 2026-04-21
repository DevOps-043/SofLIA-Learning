import { createAdminClient, createGoogleCalendarEvent, getCalendarAccessToken, persistSessionCalendarSync } from '../calendar.service'
import { getCurrentTimezone } from '../format.utils'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'
import { withTimezoneOffset } from './planning-actions-v2-timezone.service'

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

