export interface CleanupCalendarEvent {
  id: string
  summary?: string
}

export async function getCleanupCalendarEvents(params: {
  accessToken: string
  calendarId: string
  endDate: Date
  provider: string
  startDate: Date
}): Promise<CleanupCalendarEvent[]> {
  if (params.provider === 'google') {
    return getGoogleCalendarEvents(
      params.accessToken,
      params.calendarId,
      params.startDate,
      params.endDate,
    )
  }

  if (params.provider === 'microsoft') {
    return getMicrosoftCalendarEvents(params.accessToken, params.startDate, params.endDate)
  }

  return []
}

export async function deleteCleanupCalendarEvent(params: {
  accessToken: string
  calendarId: string
  eventId: string
  provider: string
}): Promise<boolean> {
  if (params.provider === 'google') {
    return deleteGoogleEvent(params.accessToken, params.eventId, params.calendarId)
  }

  if (params.provider === 'microsoft') {
    return deleteMicrosoftEvent(params.accessToken, params.eventId)
  }

  return false
}

async function getGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date,
): Promise<CleanupCalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '500',
    })
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!response.ok) {
      console.error('[Cleanup] Error obteniendo eventos de Google:', await response.text())
      return []
    }

    const data = await response.json()
    return (data.items || []).map((event: { id: string; summary?: string }) => ({
      id: event.id,
      summary: event.summary,
    }))
  } catch (error) {
    console.error('[Cleanup] Error en getGoogleCalendarEvents:', error)
    return []
  }
}

async function getMicrosoftCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
): Promise<CleanupCalendarEvent[]> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&$top=500`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!response.ok) {
      console.error('[Cleanup] Error obteniendo eventos de Microsoft:', await response.text())
      return []
    }

    const data = await response.json()
    return (data.value || []).map((event: { id: string; subject?: string }) => ({
      id: event.id,
      summary: event.subject,
    }))
  } catch (error) {
    console.error('[Cleanup] Error en getMicrosoftCalendarEvents:', error)
    return []
  }
}

async function deleteGoogleEvent(
  accessToken: string,
  eventId: string,
  calendarId: string,
): Promise<boolean> {
  try {
    const cleanEventId = eventId.split('_')[0]
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(cleanEventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    return response.ok || response.status === 404
  } catch (error) {
    console.error('[Cleanup] Error en deleteGoogleEvent:', error)
    return false
  }
}

async function deleteMicrosoftEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    return response.ok || response.status === 404
  } catch (error) {
    console.error('[Cleanup] Error en deleteMicrosoftEvent:', error)
    return false
  }
}
