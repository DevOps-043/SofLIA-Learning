import { logger } from '../../../../../lib/utils/logger'
import {
  createAdminClient,
  createGoogleCalendarEvent,
  normalizeCalendarEventId,
  persistSessionCalendarSync,
  resolveSessionCalendarSync,
} from './calendar.service'
import { findMatchingCalendarEvent } from './analysis-calendar-sync.service'
import type { CalendarEvent, SyncResult } from './types'

interface SyncSessionRow {
  id: string
  title: string
  external_event_id: string | null
  calendar_provider: 'google' | 'microsoft' | null
  start_time: string
  end_time: string
  plan_id: string
  metrics: unknown
}

function isSessionWithinCalendarRange(sessionStartTime: string): boolean {
  const sessionTime = new Date(sessionStartTime).getTime()
  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  return sessionTime >= now - 7 * 24 * 60 * 60 * 1000 && sessionTime <= now + thirtyDaysMs
}

function buildCalendarLookupSets(calendarEvents: CalendarEvent[]) {
  const calendarEventIds = new Set(
    calendarEvents.map((event) => normalizeCalendarEventId(event.id)).filter(Boolean),
  )

  const linkedStudySessionIds = new Set(
    calendarEvents
      .map((event) => {
        const linkedSessionId = (event as CalendarEvent & { linkedStudySessionId?: string | null })
          .linkedStudySessionId

        return typeof linkedSessionId === 'string' ? linkedSessionId : null
      })
      .filter((value): value is string => Boolean(value)),
  )

  return { calendarEventIds, linkedStudySessionIds }
}

async function markSessionAsOrphaned(params: {
  supabase: ReturnType<typeof createAdminClient>
  session: SyncSessionRow
  result: SyncResult
}): Promise<void> {
  const { error } = await params.supabase
    .from('study_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.session.id)

  if (error) {
    logger.error(`Error actualizando sesion huérfana ${params.session.id}: ${error.message}`)
    return
  }

  params.result.orphanedSessions.push(params.session.title)
}

async function restoreFutureSessionLink(params: {
  accessToken: string
  session: SyncSessionRow
  planId: string
  calendarId?: string | null
  timezone?: string
  supabase: ReturnType<typeof createAdminClient>
}): Promise<boolean> {
  const isFutureSession = new Date(params.session.start_time).getTime() > Date.now()
  if (!isFutureSession || params.calendarId === undefined) {
    return false
  }

  const eventId = await createGoogleCalendarEvent(
    params.accessToken,
    {
      title: params.session.title,
      start_time: params.session.start_time,
      end_time: params.session.end_time,
      description: '',
      sessionId: params.session.id,
      planId: params.planId,
    },
    params.timezone || 'America/Mexico_City',
    params.calendarId ?? null,
  ).catch(() => null)

  if (!eventId) {
    return false
  }

  await persistSessionCalendarSync({
    supabase: params.supabase,
    sessionId: params.session.id,
    eventId,
    provider: 'google',
    calendarId: params.calendarId ?? null,
    source: 'resync',
    existingSession: params.session,
  })

  return true
}

export async function syncSessionsWithCalendar(
  userId: string,
  planId: string,
  accessToken: string,
  calendarEvents: CalendarEvent[],
  calendarId?: string | null,
  timezone?: string,
): Promise<SyncResult> {
  const supabase = createAdminClient()
  const result: SyncResult = {
    deletedFromDb: [],
    orphanedSessions: [],
    message: '',
  }

  logger.info(`Iniciando sincronizacion bidireccional para plan ${planId} del usuario ${userId}`)

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, title, external_event_id, calendar_provider, start_time, end_time, plan_id, metrics')
    .eq('plan_id', planId)
    .gte('start_time', oneWeekAgo.toISOString())
    .lte('start_time', thirtyDaysLater.toISOString())

  const sessions = (data || []) as SyncSessionRow[]

  if (error || sessions.length === 0) {
    logger.info('No hay sesiones de estudio para sincronizar')
    return result
  }

  const { calendarEventIds, linkedStudySessionIds } = buildCalendarLookupSets(calendarEvents)

  for (const session of sessions) {
    const sessionCalendarSync = resolveSessionCalendarSync({
      externalEventId: session.external_event_id,
      calendarProvider: session.calendar_provider,
      metrics: session.metrics,
    })
    const normalizedEventId = normalizeCalendarEventId(
      sessionCalendarSync?.normalizedExternalEventId || sessionCalendarSync?.externalEventId,
    )

    if (normalizedEventId) {
      const hasLinkedCalendarEvent =
        calendarEventIds.has(normalizedEventId) || linkedStudySessionIds.has(session.id)

      if (!hasLinkedCalendarEvent && isSessionWithinCalendarRange(session.start_time)) {
        await markSessionAsOrphaned({ supabase, session, result })
      }

      continue
    }

    const matchingEvent = findMatchingCalendarEvent({
      session,
      calendarEvents,
      calendarEventIds,
    })

    if (matchingEvent) {
      await persistSessionCalendarSync({
        supabase,
        sessionId: session.id,
        eventId: matchingEvent.id,
        provider: 'google',
        source: 'sync',
        existingSession: session,
      })
      continue
    }

    const restored = await restoreFutureSessionLink({
      accessToken,
      session,
      planId,
      calendarId,
      timezone,
      supabase,
    })

    if (!restored) {
      logger.info(`Sesion ${session.title} sin match en calendario; se mantiene sin vinculo`)
    }
  }

  if (result.orphanedSessions.length > 0) {
    result.message = `Se detectaron ${result.orphanedSessions.length} sesion(es) del plan sin vinculo valido con el calendario: ${result.orphanedSessions.join(', ')}. No se eliminaron del sistema.`
  }

  return result
}
