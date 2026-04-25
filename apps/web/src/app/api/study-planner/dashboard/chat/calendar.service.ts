/**
 * Calendar Service Facade
 * Keeps the existing public API while delegating to smaller modules.
 */

import { logger } from '../../../../../lib/utils/logger'
import { resolveStudySessionTitle } from '../../study-session-title.utils'
import {
  createAdminClient,
  createLegacyAdminClient,
  getCalendarAccessToken,
  refreshAccessToken,
} from './calendar-access.service'
import {
  buildSessionCalendarSyncPatch,
  normalizeCalendarEventId,
  parseSessionMetrics,
  persistSessionCalendarSync,
  resolveSessionCalendarSync,
  type SessionCalendarSyncMetadata,
  type SessionMetricsPayload,
  type StudySessionCalendarLinkRecord,
} from './calendar-metrics.service'
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  listGoogleCalendarEvents,
  moveGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from './calendar-google-events.service'

interface SyncableSessionRow extends StudySessionCalendarLinkRecord {
  title: string
  description?: string | null
  start_time: string
  end_time: string
  plan_id?: string | null
}

export {
  buildSessionCalendarSyncPatch,
  createAdminClient,
  createGoogleCalendarEvent,
  createLegacyAdminClient,
  deleteGoogleCalendarEvent,
  getCalendarAccessToken,
  listGoogleCalendarEvents,
  moveGoogleCalendarEvent,
  normalizeCalendarEventId,
  parseSessionMetrics,
  persistSessionCalendarSync,
  refreshAccessToken,
  resolveSessionCalendarSync,
  updateGoogleCalendarEvent,
}

export type {
  SessionCalendarSyncMetadata,
  SessionMetricsPayload,
  StudySessionCalendarLinkRecord,
}

async function getSessionTimezone(
  supabase: ReturnType<typeof createAdminClient>,
  session: Pick<SyncableSessionRow, 'plan_id'>,
  fallbackTimezone: string,
): Promise<string> {
  if (!session.plan_id) {
    return fallbackTimezone
  }

  const { data: plan } = await supabase
    .from('study_plans')
    .select('timezone')
    .eq('id', session.plan_id)
    .single()

  return plan?.timezone || fallbackTimezone
}

function getClientReferenceId(metrics: unknown): string | undefined {
  const parsedMetrics = parseSessionMetrics(metrics)
  return typeof parsedMetrics?.clientReferenceId === 'string'
    ? parsedMetrics.clientReferenceId
    : undefined
}

export async function syncSessionWithCalendar(
  userId: string,
  sessionId: string,
  action: 'update' | 'delete',
  newData?: { start_time: string; end_time: string },
  currentTimezone: string = 'America/Mexico_City',
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient()

  logger.info(`🔄 syncSessionWithCalendar iniciado - sessionId: ${sessionId}, action: ${action}`)

  const { data: rawSession, error: sessionError } = await supabase
    .from('study_sessions')
    .select('id, title, description, start_time, end_time, external_event_id, calendar_provider, plan_id, metrics')
    .eq('id', sessionId)
    .single()

  const session = rawSession as SyncableSessionRow | null

  if (!session) {
    logger.error('Sesion no encontrada al sincronizar calendario:', sessionError)
    return { success: false, message: 'Sesion no encontrada' }
  }

  const timezone = await getSessionTimezone(supabase, session, currentTimezone)
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)
  const calendarSync = resolveSessionCalendarSync({
    externalEventId: session.external_event_id,
    calendarProvider: session.calendar_provider,
    metrics: session.metrics,
  })

  if (!accessToken) {
    return { success: true, message: 'Sin calendario conectado' }
  }

  if (provider !== 'google') {
    return { success: false, message: 'Proveedor de calendario no soportado' }
  }

  if (session.external_event_id) {
    const resolvedEventId = calendarSync?.externalEventId || session.external_event_id
    const resolvedCalendarId = calendarSync?.calendarId || calendarId

    if (action === 'delete') {
      const success = await deleteGoogleCalendarEvent(
        accessToken,
        resolvedEventId,
        resolvedCalendarId,
        sessionId,
      )

      return {
        success,
        message: success ? 'Evento eliminado del calendario' : 'Error eliminando del calendario',
      }
    }

    if (action === 'update' && newData) {
      const success = await updateGoogleCalendarEvent(
        accessToken,
        resolvedEventId,
        {
          title: resolveStudySessionTitle(session),
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
          sessionId: session.id,
          planId: session.plan_id,
          clientReferenceId: getClientReferenceId(session.metrics),
        },
        timezone,
        resolvedCalendarId,
        sessionId,
      )

      return {
        success,
        message: success ? 'Calendario actualizado' : 'Error actualizando calendario',
      }
    }
  } else if (action === 'update' && newData) {
    const eventId = await createGoogleCalendarEvent(
      accessToken,
      {
        title: resolveStudySessionTitle(session),
        description: session.description || '',
        start_time: newData.start_time,
        end_time: newData.end_time,
        sessionId: session.id,
        planId: session.plan_id,
        clientReferenceId: getClientReferenceId(session.metrics),
      },
      timezone,
      calendarId,
    )

    if (!eventId) {
      return { success: false, message: 'Error creando evento en calendario' }
    }

    try {
      await persistSessionCalendarSync({
        supabase,
        sessionId,
        eventId,
        provider: 'google',
        calendarId,
        source: 'resync',
        existingSession: session,
      })
    } catch (error) {
      logger.error('Error guardando sincronizacion de sesion en calendario:', error)
    }

    return { success: true, message: 'Evento creado en calendario' }
  } else if (action === 'delete') {
    return { success: true, message: 'Sin evento externo que eliminar' }
  }

  return { success: false, message: 'Accion no procesada' }
}
