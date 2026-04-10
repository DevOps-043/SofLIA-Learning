import type {
  CalendarDateRange,
  ExternalCalendarEvent,
  GoogleCalendarEvent,
  MicrosoftCalendarEvent,
} from './calendar-events.types'

const DEFAULT_RANGE_DAYS = 14

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime())
}

export function parseCalendarDateRange(
  requestUrl: string,
  now = new Date(),
): CalendarDateRange {
  const { searchParams } = new URL(requestUrl)
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  const startDate = startDateParam ? new Date(startDateParam) : new Date(now)
  const defaultEndDate = new Date(
    now.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000,
  )
  const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate

  return {
    startDate: isValidDate(startDate) ? startDate : new Date(now),
    endDate: isValidDate(endDate) ? endDate : defaultEndDate,
  }
}

export function parseTokenExpiry(expiresAt: unknown): Date | null {
  if (typeof expiresAt !== 'string' || !expiresAt) {
    return null
  }

  const parsedDate = new Date(expiresAt)
  return isValidDate(parsedDate) ? parsedDate : null
}

export function needsCalendarTokenRefresh(
  expiresAt: unknown,
  now = new Date(),
): boolean {
  const tokenExpiry = parseTokenExpiry(expiresAt)
  return !tokenExpiry || tokenExpiry <= now
}

export function normalizeExternalEventId(eventId: unknown): string {
  if (typeof eventId === 'string') {
    return eventId.trim()
  }

  if (eventId === null || eventId === undefined) {
    return ''
  }

  return String(eventId).trim()
}

export function mapGoogleCalendarEvent(
  event: GoogleCalendarEvent,
  calendarId: string,
): ExternalCalendarEvent {
  const isAllDay = !event.start?.dateTime
  let start = event.start?.dateTime || event.start?.date || ''
  let end = event.end?.dateTime || event.end?.date || ''

  if (isAllDay) {
    if (event.start?.date) {
      start = `${event.start.date}T00:00:00`
    }

    if (event.end?.date) {
      const endDate = new Date(`${event.end.date}T00:00:00`)
      endDate.setDate(endDate.getDate() - 1)
      const year = endDate.getFullYear()
      const month = String(endDate.getMonth() + 1).padStart(2, '0')
      const day = String(endDate.getDate()).padStart(2, '0')
      end = `${year}-${month}-${day}T23:59:59`
    }
  }

  return {
    id: event.id,
    title: event.summary || 'Sin titulo',
    description: event.description || '',
    start,
    end,
    location: event.location || '',
    status: event.status || '',
    isAllDay,
    calendarId,
    linkedStudySessionId: event.extendedProperties?.private?.sofliaSessionId,
    linkedStudyPlanId: event.extendedProperties?.private?.sofliaPlanId,
    linkedClientReferenceId: event.extendedProperties?.private?.sofliaClientReferenceId,
  }
}

export function mapMicrosoftCalendarEvent(
  event: MicrosoftCalendarEvent,
): ExternalCalendarEvent {
  let start = event.start?.dateTime || ''
  let end = event.end?.dateTime || ''

  if (event.isAllDay && start && end) {
    const startDate = start.split('T')[0]
    start = `${startDate}T00:00:00`

    const endDate = new Date(`${end.split('T')[0]}T00:00:00`)
    endDate.setDate(endDate.getDate() - 1)
    const year = endDate.getFullYear()
    const month = String(endDate.getMonth() + 1).padStart(2, '0')
    const day = String(endDate.getDate()).padStart(2, '0')
    end = `${year}-${month}-${day}T23:59:59`
  }

  return {
    id: event.id,
    title: event.subject || 'Sin titulo',
    description: event.bodyPreview || '',
    start,
    end,
    location: event.location?.displayName || '',
    status: event.showAs || '',
    isAllDay: Boolean(event.isAllDay),
  }
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
