import type { GoogleCreatedEventResponse } from './calendar-google.types';
import { getGoogleCalendarList } from './calendar-google-read.service';

export const PLATFORM_CALENDAR_NAME = 'SofLIA - Sesiones de Estudio';

export async function findPlatformCalendar(accessToken: string): Promise<string | null> {
  const calendars = await getGoogleCalendarList(accessToken);
  return calendars.find((cal) => cal.summary === PLATFORM_CALENDAR_NAME)?.id ?? null;
}

export async function createPlatformCalendar(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: PLATFORM_CALENDAR_NAME,
        description: 'Calendario de sesiones de estudio creado por SofLIA',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (!response.ok) {
      console.error('[Calendar] Error creando calendario secundario:', await response.text());
      return null;
    }
    const data: GoogleCreatedEventResponse = await response.json();
    return data.id;
  } catch (error) {
    console.error('[Calendar] Error creando calendario secundario:', error);
    return null;
  }
}

export async function getOrCreatePlatformCalendar(accessToken: string): Promise<string | null> {
  const calendarId = await findPlatformCalendar(accessToken);
  return calendarId ?? createPlatformCalendar(accessToken);
}
