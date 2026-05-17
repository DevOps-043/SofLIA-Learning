import type { ExternalCalendarEvent } from '../calendar-events.types'

export function normalizeExternalEventId(eventId: unknown): string {
  if (typeof eventId === 'string') {
    return eventId.trim()
  }

  if (eventId === null || eventId === undefined) {
    return ''
  }

  return String(eventId).trim()
}

export function buildExternalEventIdSet(
  events: Array<Pick<ExternalCalendarEvent, 'id'>>,
): Set<string> {
  return new Set(
    events
      .map((event) => normalizeExternalEventId(event.id))
      .filter(Boolean),
  )
}

export function filterOrphanedCalendarEvents(
  events: ExternalCalendarEvent[],
  orphanedEventIds: Set<string>,
): ExternalCalendarEvent[] {
  return events.filter((event) => {
    return !orphanedEventIds.has(normalizeExternalEventId(event.id))
  })
}
