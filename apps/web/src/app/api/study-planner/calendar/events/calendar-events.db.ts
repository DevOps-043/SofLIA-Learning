import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeExternalEventId,
} from './calendar-events.utils'
import type {
  CalendarIntegrationRecord,
  CalendarProvider,
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
