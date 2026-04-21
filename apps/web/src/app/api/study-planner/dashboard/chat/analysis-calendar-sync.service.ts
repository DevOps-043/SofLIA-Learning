import { logger } from '../../../../../lib/utils/logger'
import {
  normalizeCalendarEventId,
  resolveSessionCalendarSync,
} from './calendar.service'
import type { CalendarEvent } from './types'

interface CalendarSyncCandidateSession {
  title: string
  external_event_id: string | null
  calendar_provider: string | null
  start_time: string
  end_time: string
  metrics: unknown
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findMatchingCalendarEvent(params: {
  session: CalendarSyncCandidateSession
  calendarEvents: CalendarEvent[]
  calendarEventIds: Set<string>
}): CalendarEvent | undefined {
  const { session, calendarEvents, calendarEventIds } = params

  const sessionCalendarSync = resolveSessionCalendarSync({
    externalEventId: session.external_event_id,
    calendarProvider: session.calendar_provider,
    metrics: session.metrics,
  })
  const normalizedEventId = normalizeCalendarEventId(
    sessionCalendarSync?.normalizedExternalEventId || sessionCalendarSync?.externalEventId,
  )

  if (normalizedEventId && calendarEventIds.has(normalizedEventId)) {
    logger.info(`Match por external_event_id para "${session.title}"`)
    return calendarEvents.find(
      (event) => normalizeCalendarEventId(event.id) === normalizedEventId,
    )
  }

  const sessionStart = new Date(session.start_time).getTime()
  const sessionEnd = new Date(session.end_time).getTime()
  const normalizedSessionTitle = normalizeText(session.title)
  const sessionKeywords = normalizedSessionTitle
    .split(' ')
    .filter((word) => word.length > 3)
    .slice(0, 3)

  return calendarEvents.find((event) => {
    const normalizedEventTitle = normalizeText(event.title)
    const directMatch =
      normalizedEventTitle.includes(normalizedSessionTitle.slice(0, 15))
      || normalizedSessionTitle.includes(normalizedEventTitle.slice(0, 15))
    const keywordMatch =
      sessionKeywords.length > 0
      && sessionKeywords.some((keyword) => normalizedEventTitle.includes(keyword))
    const bothStudySessions =
      event.isStudySession
      && (session.title.toLowerCase().includes('leccion')
        || session.title.toLowerCase().includes('lesson'))

    const titleMatch = directMatch || keywordMatch || bothStudySessions
    const eventStart = new Date(event.start).getTime()
    const eventEnd = new Date(event.end).getTime()
    const timeMatch =
      Math.abs(sessionStart - eventStart) < 15 * 60 * 1000
      && Math.abs(sessionEnd - eventEnd) < 15 * 60 * 1000
    const sameDayMatch =
      new Date(session.start_time).toDateString() === new Date(event.start).toDateString()
      && Math.abs(sessionStart - eventStart) < 30 * 60 * 1000

    if ((titleMatch && timeMatch) || (titleMatch && sameDayMatch)) {
      logger.info(`Match encontrado para "${session.title}" con evento "${event.title}"`)
      return true
    }

    return false
  })
}
