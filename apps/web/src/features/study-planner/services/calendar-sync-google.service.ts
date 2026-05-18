import type { SyncResult, CalendarEventData, CalendarEventUpdateData } from './calendar-sync.types';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

function cleanEventId(eventId: string): string {
  return eventId.split('_')[0];
}

export async function syncDeleteGoogleEvent(
  accessToken: string,
  eventId: string,
  calendarId: string | null,
): Promise<SyncResult> {
  try {
    const targetCalendarId = calendarId || 'primary';
    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId(eventId))}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (response.ok || response.status === 404) return { success: true };

    const errorText = await response.text();
    if (response.status === 403) {
      return { success: false, error: 'Permisos insuficientes para eliminar el evento. Por favor, reconecta tu calendario.' };
    }
    return { success: false, error: `Error ${response.status}: ${errorText}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function syncCreateGoogleEvent(
  accessToken: string,
  eventData: CalendarEventData,
  calendarId: string | null,
): Promise<SyncResult> {
  try {
    const targetCalendarId = calendarId || 'primary';
    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description || '',
          start: { dateTime: eventData.startTime, timeZone: eventData.timezone },
          end: { dateTime: eventData.endTime, timeZone: eventData.timezone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error ${response.status}: ${errorText}` };
    }

    const createdEvent = await response.json();
    return { success: true, eventId: createdEvent.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function syncUpdateGoogleEvent(
  accessToken: string,
  eventId: string,
  eventData: CalendarEventUpdateData,
  calendarId: string | null,
): Promise<SyncResult> {
  try {
    const targetCalendarId = calendarId || 'primary';
    const updateBody: Record<string, unknown> = {};

    if (eventData.title) updateBody.summary = eventData.title;
    if (eventData.description !== undefined) updateBody.description = eventData.description;
    if (eventData.startTime && eventData.timezone) updateBody.start = { dateTime: eventData.startTime, timeZone: eventData.timezone };
    if (eventData.endTime && eventData.timezone) updateBody.end = { dateTime: eventData.endTime, timeZone: eventData.timezone };

    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId(eventId))}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Error ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
