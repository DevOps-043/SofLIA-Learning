import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildExternalEventIdSet,
  normalizeExternalEventId,
} from './calendar-events.utils'
import {
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
} from './calendar-events-provider.service'
import type { CalendarIntegrationRecord } from './calendar-events.types'

export async function syncDeletedStudySessions(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date,
  accessToken: string,
  integration: CalendarIntegrationRecord,
) {
  try {
    const { data: sessionsWithEvents } = await supabase
      .from('study_sessions')
      .select('id, external_event_id')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null)
      .eq('calendar_provider', integration.provider)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())

    if (!sessionsWithEvents?.length) {
      return
    }

    const metadata = integration.metadata || null
    const externalEvents =
      integration.provider === 'google'
        ? await getGoogleCalendarEvents(
            accessToken,
            startDate,
            endDate,
            metadata?.secondary_calendar_id,
            metadata?.selected_calendar_ids,
          )
        : await getMicrosoftCalendarEvents(
            accessToken,
            startDate,
            endDate,
            metadata?.selected_calendar_ids,
          )

    const externalEventIds = buildExternalEventIdSet(externalEvents)
    const sessionsToClean = (sessionsWithEvents || [])
      .filter((session: Record<string, unknown>) => {
        const eventId = normalizeExternalEventId(session.external_event_id)
        return Boolean(eventId) && !externalEventIds.has(eventId)
      })
      .map((session: Record<string, unknown>) => String(session.id))

    if (!sessionsToClean.length) {
      return
    }

    await supabase
      .from('study_sessions')
      .update({
        external_event_id: null,
        calendar_provider: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', sessionsToClean)
      .eq('user_id', userId)
  } catch {
    // Intentionally swallow sync errors to avoid blocking event retrieval.
  }
}
