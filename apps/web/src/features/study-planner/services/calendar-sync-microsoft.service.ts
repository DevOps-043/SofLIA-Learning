import type { SyncResult, CalendarEventData } from './calendar-sync.types';

export async function syncDeleteMicrosoftEvent(
  accessToken: string,
  eventId: string,
): Promise<SyncResult> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (response.ok || response.status === 404) return { success: true };

    const errorText = await response.text();
    return { success: false, error: `Error ${response.status}: ${errorText}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function syncCreateMicrosoftEvent(
  accessToken: string,
  eventData: CalendarEventData,
): Promise<SyncResult> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: eventData.title,
        body: { contentType: 'HTML', content: eventData.description || '' },
        start: { dateTime: eventData.startTime, timeZone: eventData.timezone },
        end: { dateTime: eventData.endTime, timeZone: eventData.timezone },
        reminderMinutesBeforeStart: 15,
        isReminderOn: true,
      }),
    });

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
