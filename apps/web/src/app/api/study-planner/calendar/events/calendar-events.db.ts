import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  normalizeExternalEventId,
} from './calendar-events.utils'
import type {
  CalendarIntegrationRecord,
  CalendarProvider,
} from './calendar-events.types'

export function createCalendarAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas')
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getLatestCalendarIntegration(
  supabase: any,
  userId: string,
): Promise<CalendarIntegrationRecord | null> {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) {
    return null
  }

  return data[0] as CalendarIntegrationRecord
}

export async function getActiveStudySessionEventIds(
  supabase: any,
  userId: string,
  provider: CalendarProvider,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('study_sessions')
    .select('external_event_id, calendar_provider')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null)
    .eq('calendar_provider', provider)

  return new Set(
    (data || [])
      .filter(
        (session: Record<string, unknown>) =>
          session.external_event_id && session.calendar_provider === provider,
      )
      .map((session: Record<string, unknown>) =>
        normalizeExternalEventId(session.external_event_id),
      )
      .filter(Boolean),
  )
}

export async function getOrphanedCalendarEventIds(
  supabase: any,
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
    (data || [])
      .map((event: Record<string, unknown>) =>
        normalizeExternalEventId(event[eventIdColumn]),
      )
      .filter((eventId: string) => Boolean(eventId) && !activeEventIds.has(eventId)),
  )
}
