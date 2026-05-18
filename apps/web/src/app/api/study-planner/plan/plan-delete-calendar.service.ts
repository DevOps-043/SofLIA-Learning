import { deleteGoogleCalendarEvent, resolveSessionCalendarSync } from '../dashboard/chat/calendar.service'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

export async function deleteMicrosoftCalendarEvent(
  accessToken: string,
  microsoftEventId: string,
): Promise<{ success: boolean; notFound: boolean }> {
  const response = await fetchWithCircuitBreaker(
    'microsoft-calendar-plan-delete',
    `https://graph.microsoft.com/v1.0/me/calendar/events/${encodeURIComponent(microsoftEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (response.ok) {
    return { success: true, notFound: false }
  }

  if (response.status === 404) {
    return { success: true, notFound: true }
  }

  const errorText = await response.text()
  throw new Error(`Error eliminando evento de Microsoft Calendar: ${errorText}`)
}

export function resolveDeletePlanExternalEvent(params: {
  externalEventId?: string | null
  calendarProvider?: 'google' | 'microsoft' | null
  metrics?: unknown
}) {
  const calendarSync = resolveSessionCalendarSync({
    externalEventId: params.externalEventId,
    calendarProvider: params.calendarProvider,
    metrics: params.metrics,
  })

  return {
    externalEventId: calendarSync?.externalEventId || params.externalEventId || null,
    provider: calendarSync?.provider || params.calendarProvider || null,
    calendarId: calendarSync?.calendarId || null,
  }
}

export async function deleteGooglePlanEvent(params: {
  accessToken: string
  externalEventId: string
  calendarId?: string | null
  sessionId: string
}): Promise<boolean> {
  return deleteGoogleCalendarEvent(
    params.accessToken,
    params.externalEventId,
    params.calendarId,
    params.sessionId,
  )
}
