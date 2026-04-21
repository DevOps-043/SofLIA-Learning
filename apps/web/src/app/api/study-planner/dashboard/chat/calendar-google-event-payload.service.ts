export interface GoogleSessionPayloadInput {
  title: string
  start_time: string
  end_time: string
  description?: string
  timezone: string
  sessionId?: string
  planId?: string | null
  clientReferenceId?: string
}

export interface GoogleSessionMutationInput {
  title: string
  start_time: string
  end_time: string
  description?: string
  sessionId?: string
  planId?: string | null
  clientReferenceId?: string
}

export async function findGoogleEventBySessionIdentity(params: {
  accessToken: string
  sessionId: string
  calendarId?: string | null
}): Promise<{ eventId: string; calendarId: string } | null> {
  const calendarsToTry = Array.from(
    new Set([params.calendarId || null, 'primary'].filter(Boolean) as string[]),
  )

  for (const calendarId of calendarsToTry) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=${encodeURIComponent(`sofliaSessionId=${params.sessionId}`)}&singleEvents=true&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      continue
    }

    const payload = (await response.json()) as { items?: Array<{ id?: string }> }
    const eventId = payload.items?.[0]?.id
    if (eventId) {
      return { eventId, calendarId }
    }
  }

  return null
}

export function buildGoogleCalendarEventPayload(params: GoogleSessionPayloadInput) {
  return {
    summary: params.title,
    description: params.description || '',
    start: {
      dateTime: new Date(params.start_time).toISOString(),
      timeZone: params.timezone,
    },
    end: {
      dateTime: new Date(params.end_time).toISOString(),
      timeZone: params.timezone,
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 15 }],
    },
    extendedProperties: {
      private: {
        ...(params.sessionId ? { sofliaSessionId: params.sessionId } : {}),
        ...(params.planId ? { sofliaPlanId: params.planId } : {}),
        ...(params.clientReferenceId
          ? { sofliaClientReferenceId: params.clientReferenceId }
          : {}),
      },
    },
  }
}
