import type {
  GoogleCalendarWriteResult,
  GoogleCreatedEventResponse,
  GoogleEventCreateInput,
  GoogleEventUpdateInput,
  GoogleEventUpdatePayload,
} from './calendar-google.types';
export { deleteGoogleEvent } from './calendar-google-delete.service';

export async function createGoogleEvent(
  accessToken: string,
  event: GoogleEventCreateInput,
  calendarId: string | null,
): Promise<GoogleCalendarWriteResult | null> {
  try {
    const targetCalendarId = calendarId || 'primary';
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: event.title,
          description: event.description || '',
          location: event.location || '',
          start: { dateTime: event.startTime, timeZone: event.timezone },
          end: { dateTime: event.endTime, timeZone: event.timezone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
        }),
      },
    );
    if (!response.ok) {
      console.error('[Calendar] Error creando evento:', await response.text());
      return null;
    }
    const data: GoogleCreatedEventResponse = await response.json();
    return { id: data.id, htmlLink: data.htmlLink };
  } catch (error) {
    console.error('[Calendar] Error creando evento:', error);
    return null;
  }
}

export async function updateGoogleEvent(
  accessToken: string,
  eventId: string,
  event: GoogleEventUpdateInput,
  calendarId: string | null,
): Promise<boolean> {
  try {
    const targetCalendarId = calendarId || 'primary';
    const updateData: GoogleEventUpdatePayload = {};
    if (event.title) updateData.summary = event.title;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.location !== undefined) updateData.location = event.location;
    if (event.startTime && event.timezone) updateData.start = { dateTime: event.startTime, timeZone: event.timezone };
    if (event.endTime && event.timezone) updateData.end = { dateTime: event.endTime, timeZone: event.timezone };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      },
    );
    if (!response.ok) {
      console.error('[Calendar] Error actualizando evento:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Calendar] Error actualizando evento:', error);
    return false;
  }
}
