import { logger } from '../../../../../lib/utils/logger'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { normalizeCalendarEventId } from './calendar-metrics.service'
import {
  buildGoogleCalendarEventPayload,
  findGoogleEventBySessionIdentity,
  type GoogleSessionMutationInput,
} from './calendar-google-event-payload.service'
import type { CalendarEvent } from './types'

export { moveGoogleCalendarEvent } from './calendar-google-move-event.service'

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  session: GoogleSessionMutationInput,
  timezone: string,
  calendarId: string | null = null,
  sessionId?: string,
): Promise<boolean> {
  try {
    const event = buildGoogleCalendarEventPayload({
      ...session,
      timezone,
    })
    const targetCalendarId = calendarId || 'primary'

    const response = await fetchWithCircuitBreaker(
      'google-calendar-dashboard-chat',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )

    if (!response.ok) {
      if (response.status === 404 && sessionId) {
        const linkedEvent = await findGoogleEventBySessionIdentity({
          accessToken,
          sessionId,
          calendarId: targetCalendarId,
        })

        if (linkedEvent) {
          return updateGoogleCalendarEvent(
            accessToken,
            linkedEvent.eventId,
            session,
            timezone,
            linkedEvent.calendarId,
          )
        }
      }

      logger.error('Error actualizando evento en Google Calendar:', await response.text())
      return false
    }

    return true
  } catch (error) {
    logger.error('Error en updateGoogleCalendarEvent:', error)
    return false
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string | null = null,
  sessionId?: string,
): Promise<boolean> {
  try {
    const cleanEventId = normalizeCalendarEventId(eventId)
    const targetCalendarId = calendarId || 'primary'
    const response = await fetchWithCircuitBreaker(
      'google-calendar-dashboard-chat',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallbackResponse = await fetchWithCircuitBreaker(
        'google-calendar-dashboard-chat',
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (fallbackResponse.ok || fallbackResponse.status === 404) {
        return true
      }

      logger.error(
        'Error eliminando evento de Google Calendar en fallback primary:',
        await fallbackResponse.text(),
      )
      return false
    }

    if (response.status === 404 && sessionId) {
      const linkedEvent = await findGoogleEventBySessionIdentity({
        accessToken,
        sessionId,
        calendarId: targetCalendarId,
      })

      if (linkedEvent) {
        return deleteGoogleCalendarEvent(accessToken, linkedEvent.eventId, linkedEvent.calendarId)
      }
    }

    if (!response.ok && response.status !== 404) {
      logger.error('Error eliminando evento de Google Calendar:', await response.text())
      return false
    }

    return true
  } catch (error) {
    logger.error('Error en deleteGoogleCalendarEvent:', error)
    return false
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  session: GoogleSessionMutationInput,
  timezone: string,
  calendarId: string | null = null,
): Promise<string | null> {
  try {
    const event = buildGoogleCalendarEventPayload({
      ...session,
      timezone,
    })
    const targetCalendarId = calendarId || 'primary'

    const response = await fetchWithCircuitBreaker(
      'google-calendar-dashboard-chat',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )

    if (!response.ok) {
      logger.error('Error creando evento en Google Calendar:', await response.text())
      return null
    }

    const createdEvent = await response.json()
    return createdEvent.id || null
  } catch (error) {
    logger.error('Error en createGoogleCalendarEvent:', error)
    return null
  }
}

export async function listGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  _timezone: string,
  studySessionEventIds?: Set<string>,
  selectedCalendarIds?: string[] | null,
): Promise<CalendarEvent[]> {
  try {
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(
      accessToken,
      startDate,
      endDate,
      selectedCalendarIds ?? undefined,
    )

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime,
      end: event.endTime,
      isAllDay: event.isAllDay,
      isStudySession: studySessionEventIds
        ? studySessionEventIds.has(event.id)
        : (event.title?.includes('📚') || event.description?.includes('Aprende y Aplica')) ?? false,
    }))
  } catch (error) {
    logger.error('Error en listGoogleCalendarEvents:', error)
    return []
  }
}
