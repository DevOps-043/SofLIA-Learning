import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeExternalEventId,
} from './calendar-events.utils'
import { resolveStudySessionTitle } from '../../study-session-title.utils'
import type {
  CalendarIntegrationRecord,
  CalendarProvider,
  ExternalCalendarEvent,
} from './calendar-events.types'

type CalendarAdminClient = ReturnType<typeof createAdminClient>

interface StudySessionExternalEventRow {
  external_event_id: string | null
  metrics?: {
    calendarSync?: {
      normalizedExternalEventId?: unknown
      externalEventId?: unknown
    } | null
  } | null
}

interface UserCalendarEventRow {
  google_event_id?: string | null
  microsoft_event_id?: string | null
}

interface StudySessionCalendarEventRow {
  id: string
  plan_id: string | null
  title: string | null
  description: string | null
  start_time: string
  end_time: string
  status: string | null
  external_event_id: string | null
  metrics?: unknown
}

const CALENDAR_INTEGRATION_SELECT = `
  id,
  user_id,
  provider,
  access_token,
  refresh_token,
  expires_at,
  metadata
`

export function createCalendarAdminClient() {
  try {
    return createAdminClient()
  } catch {
    throw new Error('Variables de Supabase no configuradas')
  }
}

export async function getLatestCalendarIntegration(
  supabase: CalendarAdminClient,
  userId: string,
): Promise<CalendarIntegrationRecord | null> {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select(CALENDAR_INTEGRATION_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) {
    return null
  }

  return data[0] as CalendarIntegrationRecord
}

export async function getActiveStudySessionEventIds(
  supabase: CalendarAdminClient,
  userId: string,
  provider: CalendarProvider,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('study_sessions')
    .select('external_event_id, metrics')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null)
    .eq('calendar_provider', provider)

  return new Set(
    ((data || []) as StudySessionExternalEventRow[])
      .filter((session) => session.external_event_id)
      .map((session) =>
        normalizeExternalEventId(
          typeof session.metrics?.calendarSync?.normalizedExternalEventId === 'string'
            ? session.metrics.calendarSync.normalizedExternalEventId
            : typeof session.metrics?.calendarSync?.externalEventId === 'string'
              ? session.metrics.calendarSync.externalEventId
              : session.external_event_id,
        ),
      )
      .filter(Boolean),
  )
}

export async function getOrphanedCalendarEventIds(
  supabase: CalendarAdminClient,
  userId: string,
  provider: CalendarProvider,
  activeEventIds: Set<string>,
): Promise<Set<string>> {
  const eventIdColumn =
    provider === 'google' ? 'google_event_id' : 'microsoft_event_id'

  const { data } = await supabase
    .from('user_calendar_events')
    .select(eventIdColumn)
    .eq('user_id', userId)
    .not(eventIdColumn, 'is', null)

  return new Set(
    ((data || []) as UserCalendarEventRow[])
      .map((event) =>
        normalizeExternalEventId(event[eventIdColumn]),
      )
      .filter((eventId: string) => Boolean(eventId) && !activeEventIds.has(eventId)),
  )
}

export async function getStudySessionCalendarEvents(
  supabase: CalendarAdminClient,
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<ExternalCalendarEvent[]> {
  const { data } = await supabase
    .from('study_sessions')
    .select('id, plan_id, title, description, start_time, end_time, status, external_event_id, metrics')
    .eq('user_id', userId)
    .lt('start_time', endDate.toISOString())
    .gt('end_time', startDate.toISOString())

  return ((data || []) as StudySessionCalendarEventRow[])
    .filter((session) => !['cancelled', 'canceled', 'deleted'].includes(session.status || ''))
    .map((session) => ({
      id: `study-session:${session.id}`,
      title: resolveStudySessionTitle(session),
      description: session.description || '',
      start: session.start_time,
      end: session.end_time,
      location: '',
      status: session.status || 'planned',
      isAllDay: false,
      linkedStudySessionId: session.id,
      linkedStudyPlanId: session.plan_id || undefined,
    }))
}
