import type { CalendarEvent } from '../types/user-context.types';
import { logger } from '@/lib/logger';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { CalendarDbService } from './calendar-db.service';
import type {
  CalendarListEntry,
  GoogleCalendarEventsResponse,
  GoogleCalendarListResponse,
} from './calendar-google.types';

export async function getGoogleCalendarList(accessToken: string): Promise<CalendarListEntry[]> {
  try {
    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      logger.warn('[Calendar] Error obteniendo lista de calendarios', { status: response.status });
      return [];
    }
    const data: GoogleCalendarListResponse = await response.json();
    return (data.items || []).map((cal) => ({
      id: cal.id,
      summary: cal.summary || 'Sin nombre',
      primary: cal.primary || false,
      accessRole: cal.accessRole || 'reader',
      backgroundColor: cal.backgroundColor,
    }));
  } catch (error) {
    logger.warn('[Calendar] Error obteniendo lista de calendarios', { error });
    return [];
  }
}

export async function getFreeBusyInfo(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  calendarIds?: string[],
  userId?: string,
): Promise<{
  calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
  allBusySlots: Array<{ start: Date; end: Date }>;
}> {
  try {
    let idsToQuery = calendarIds;
    if (!idsToQuery || idsToQuery.length === 0) {
      if (userId) {
        const selectedIds = await CalendarDbService.getSelectedCalendarIds(userId);
        if (selectedIds && selectedIds.length > 0) idsToQuery = selectedIds;
      }
    }
    if (!idsToQuery || idsToQuery.length === 0) {
      const calendars = await getGoogleCalendarList(accessToken);
      idsToQuery = calendars
        .filter((cal) => ['owner', 'writer', 'reader'].includes(cal.accessRole))
        .map((cal) => cal.id);
    }
    if (idsToQuery.length === 0) return { calendars: {}, allBusySlots: [] };

    const response = await fetchWithCircuitBreaker('google-calendar', 'https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: idsToQuery.map((id) => ({ id })),
      }),
    });

    if (!response.ok) {
      logger.warn('[Calendar] Error obteniendo free/busy', { status: response.status });
      return { calendars: {}, allBusySlots: [] };
    }

    const data = await response.json();
    const calendars: Record<string, { busy: Array<{ start: string; end: string }> }> = {};
    const allBusySlots: Array<{ start: Date; end: Date }> = [];

    for (const [calId, calData] of Object.entries(data.calendars || {})) {
      const busyInfo = calData as { busy?: Array<{ start: string; end: string }> };
      calendars[calId] = { busy: busyInfo.busy || [] };
      for (const slot of busyInfo.busy || []) {
        allBusySlots.push({ start: new Date(slot.start), end: new Date(slot.end) });
      }
    }

    allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    const mergedSlots: Array<{ start: Date; end: Date }> = [];
    for (const slot of allBusySlots) {
      if (mergedSlots.length === 0) {
        mergedSlots.push({ ...slot });
      } else {
        const last = mergedSlots[mergedSlots.length - 1];
        if (slot.start <= last.end) {
          last.end = new Date(Math.max(last.end.getTime(), slot.end.getTime()));
        } else {
          mergedSlots.push({ ...slot });
        }
      }
    }

    return { calendars, allBusySlots: mergedSlots };
  } catch (error) {
    logger.warn('[Calendar] Error obteniendo free/busy', { error });
    return { calendars: {}, allBusySlots: [] };
  }
}

async function getEventsFromSingleCalendar(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      logger.warn('Error obteniendo eventos de Google Calendar', { calendarId, status: response.status });
      return [];
    }
    const data: GoogleCalendarEventsResponse = await response.json();
    return (data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || 'Sin título',
      description: event.description,
      startTime: event.start?.dateTime || event.start?.date,
      endTime: event.end?.dateTime || event.end?.date,
      isAllDay: !!event.start?.date,
      isRecurring: !!event.recurringEventId,
      location: event.location,
      status:
        event.status === 'confirmed'
          ? 'confirmed'
          : event.status === 'tentative'
            ? 'tentative'
            : 'cancelled',
      calendarId,
    }));
  } catch (error) {
    logger.warn('Error obteniendo eventos de Google Calendar', { calendarId, error });
    return [];
  }
}

export async function getGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  selectedCalendarIds?: string[],
): Promise<CalendarEvent[]> {
  try {
    const calendarsResponse = await fetchWithCircuitBreaker(
      'google-calendar',
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!calendarsResponse.ok) {
      logger.warn('Error obteniendo lista de calendarios de Google', { status: calendarsResponse.status });
      return getEventsFromSingleCalendar(accessToken, 'primary', startDate, endDate);
    }

    const calendarsData: GoogleCalendarListResponse = await calendarsResponse.json();
    const calendars = calendarsData.items || [];
    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      if (selectedCalendarIds && selectedCalendarIds.length > 0) {
        if (!selectedCalendarIds.includes(calendar.id)) continue;
      } else if (!(['owner', 'writer', 'reader'].includes(calendar.accessRole ?? '') || calendar.primary)) {
        continue;
      }
      const events = await getEventsFromSingleCalendar(accessToken, calendar.id, startDate, endDate);
      allEvents.push(...events);
    }

    allEvents.sort((a, b) => new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime());
    return allEvents;
  } catch (error) {
    logger.warn('Error obteniendo eventos de Google', { error });
    return [];
  }
}
