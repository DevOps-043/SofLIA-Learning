import {
  mapGoogleCalendarEvent,
  mapMicrosoftCalendarEvent,
} from './calendar-events.utils'
import type {
  ExternalCalendarEvent,
  GoogleCalendarEventsResponse,
  GoogleCalendarListResponse,
  MicrosoftCalendarEventsResponse,
} from './calendar-events.types'

async function getEventsFromGoogleCalendar(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date,
): Promise<ExternalCalendarEvent[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${startDate.toISOString()}&` +
        `timeMax=${endDate.toISOString()}&` +
        'singleEvents=true&' +
        'orderBy=startTime&' +
        'maxResults=250',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const data: GoogleCalendarEventsResponse = await response.json()
    return (data.items || []).map((event) =>
      mapGoogleCalendarEvent(event, calendarId),
    )
  } catch {
    return []
  }
}

export async function getGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  secondaryCalendarId?: string,
  selectedCalendarIds?: string[],
): Promise<ExternalCalendarEvent[]> {
  try {
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text()

      if (calendarsResponse.status === 403) {
        if (
          errorText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
          errorText.includes('Insufficient Permission') ||
          errorText.includes('insufficient authentication scopes')
        ) {
          throw new Error(
            'SCOPE_INSUFFICIENT: Los permisos del calendario han cambiado. Por favor, desconecta y vuelve a conectar tu calendario de Google.',
          )
        }
      }

      return getEventsFromGoogleCalendar(
        accessToken,
        'primary',
        startDate,
        endDate,
      )
    }

    const calendarsData: GoogleCalendarListResponse = await calendarsResponse.json()
    const calendars = calendarsData.items || []
    const allEvents: ExternalCalendarEvent[] = []

    for (const calendar of calendars) {
      const isSofliaCalendar =
        (secondaryCalendarId && calendar.id === secondaryCalendarId) ||
        calendar.summary?.toLowerCase() === 'soflia - sesiones de estudio'

      const shouldInclude =
        selectedCalendarIds && selectedCalendarIds.length > 0
          ? selectedCalendarIds.includes(calendar.id) || isSofliaCalendar
          : calendar.primary === true || isSofliaCalendar

      if (!shouldInclude) {
        continue
      }

      const calendarEvents = await getEventsFromGoogleCalendar(
        accessToken,
        calendar.id,
        startDate,
        endDate,
      )
      allEvents.push(...calendarEvents)
    }

    return allEvents.sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime(),
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('SCOPE_INSUFFICIENT')) {
      throw error
    }

    return []
  }
}

export async function getMicrosoftCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  selectedCalendarIds?: string[],
): Promise<ExternalCalendarEvent[]> {
  try {
    if (selectedCalendarIds && selectedCalendarIds.length > 0) {
      const allEvents: ExternalCalendarEvent[] = []

      for (const calendarId of selectedCalendarIds) {
        const params = new URLSearchParams({
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          $orderby: 'start/dateTime',
          $top: '100',
        })

        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${params}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!response.ok) {
          continue
        }

        const data: MicrosoftCalendarEventsResponse = await response.json()
        allEvents.push(
          ...(data.value || []).map((event) =>
            mapMicrosoftCalendarEvent(event),
          ),
        )
      }

      return allEvents
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?` +
        `startDateTime=${startDate.toISOString()}&` +
        `endDateTime=${endDate.toISOString()}&` +
        '$orderby=start/dateTime&' +
        '$top=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const data: MicrosoftCalendarEventsResponse = await response.json()
    return (data.value || []).map((event) =>
      mapMicrosoftCalendarEvent(event),
    )
  } catch {
    return []
  }
}
