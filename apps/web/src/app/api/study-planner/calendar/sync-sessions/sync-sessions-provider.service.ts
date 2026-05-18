import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { resolveStudySessionTitle } from '../../study-session-title.utils'
import type { StudySessionRecord, SyncSessionEventResult } from './sync-sessions.types'
import {
  buildStudySessionDescription,
  formatDateTimeInTimezone,
  isValidSessionDateRange,
} from './sync-sessions.utils'

function buildGoogleEventPayload(
  session: StudySessionRecord,
  timezone: string,
) {
  const { startTime, endTime } = isValidSessionDateRange(session)
  const clientReferenceId =
    typeof session.metrics?.clientReferenceId === 'string'
      ? session.metrics.clientReferenceId
      : undefined

  return {
    summary: resolveStudySessionTitle(session),
    description: buildStudySessionDescription(session),
    start: {
      dateTime: formatDateTimeInTimezone(startTime, timezone),
      timeZone: timezone,
    },
    end: {
      dateTime: formatDateTimeInTimezone(endTime, timezone),
      timeZone: timezone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
    extendedProperties: {
      private: {
        sofliaSessionId: session.id,
        ...(session.plan_id ? { sofliaPlanId: session.plan_id } : {}),
        ...(clientReferenceId
          ? { sofliaClientReferenceId: clientReferenceId }
          : {}),
      },
    },
  }
}

function buildMicrosoftEventPayload(
  session: StudySessionRecord,
  timezone: string,
) {
  const { startTime, endTime } = isValidSessionDateRange(session)

  return {
    subject: resolveStudySessionTitle(session),
    body: {
      contentType: 'HTML',
      content: buildStudySessionDescription(session),
    },
    start: {
      dateTime: formatDateTimeInTimezone(startTime, timezone),
      timeZone: timezone,
    },
    end: {
      dateTime: formatDateTimeInTimezone(endTime, timezone),
      timeZone: timezone,
    },
    reminderMinutesBeforeStart: 15,
    isReminderOn: true,
  }
}

export async function createGoogleStudySessionEvent(
  accessToken: string,
  session: StudySessionRecord,
  timezone: string,
  calendarId: string | null,
): Promise<SyncSessionEventResult> {
  if (!isValidSessionDateRange(session).isValid) {
    return { eventId: null }
  }

  const event = buildGoogleEventPayload(session, timezone)
  const targetCalendarId = calendarId || 'primary'

  const response = await fetchWithCircuitBreaker(
    'google-calendar-sync-sessions',
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

  if (response.ok) {
    const createdEvent = await response.json()
    return { eventId: createdEvent.id }
  }

  if (response.status !== 404 || targetCalendarId === 'primary') {
    return { eventId: null }
  }

  const recreatedCalendarId =
    await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken)

  if (recreatedCalendarId) {
    const retryResponse = await fetchWithCircuitBreaker(
      'google-calendar-sync-sessions',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(recreatedCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )

    if (retryResponse.ok) {
      const retryEvent = await retryResponse.json()
      return {
        eventId: retryEvent.id,
        newSecondaryCalendarId: recreatedCalendarId,
      }
    }
  }

  const fallbackResponse = await fetchWithCircuitBreaker(
    'google-calendar-sync-sessions',
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!fallbackResponse.ok) {
    return { eventId: null }
  }

  const fallbackEvent = await fallbackResponse.json()
  return { eventId: fallbackEvent.id }
}

export async function createMicrosoftStudySessionEvent(
  accessToken: string,
  session: StudySessionRecord,
  timezone: string,
): Promise<SyncSessionEventResult> {
  if (!isValidSessionDateRange(session).isValid) {
    return { eventId: null }
  }

  const response = await fetchWithCircuitBreaker(
    'microsoft-calendar-sync-sessions',
    'https://graph.microsoft.com/v1.0/me/calendar/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildMicrosoftEventPayload(session, timezone)),
    },
  )

  if (!response.ok) {
    return { eventId: null }
  }

  const createdEvent = await response.json()
  return { eventId: createdEvent.id }
}
