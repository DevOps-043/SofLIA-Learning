import { logger as techDebtLogger } from '@/lib/utils/logger'
import { CalendarIntegrationService } from '../../../../features/study-planner/services/calendar-integration.service';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import type {
  CalendarEventCreateInput,
  CreatedGoogleCalendarEvent,
  ExternalCalendarEvent,
} from './calendar-event-provider.types';

export async function getGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
): Promise<ExternalCalendarEvent[]> {
  try {
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(accessToken, startDate, endDate);

    return events.map((event) => ({
      id: event.id,
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime, date: event.isAllDay ? event.startTime : undefined },
      end: { dateTime: event.endTime, date: event.isAllDay ? event.endTime : undefined },
      location: event.location,
      status: event.status,
    }));
  } catch (error) {
    techDebtLogger.error('Error obteniendo eventos de Google Calendar:', error);
    return [];
  }
}

export async function getMicrosoftCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
): Promise<ExternalCalendarEvent[]> {
  try {
    const response = await fetchWithCircuitBreaker(
      'microsoft-calendar-events',
      `https://graph.microsoft.com/v1.0/me/calendarview?` +
      `startDateTime=${startDate.toISOString()}&` +
      `endDateTime=${endDate.toISOString()}&` +
      `$orderby=start/dateTime&` +
      `$top=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { value?: ExternalCalendarEvent[] };
    return data.value || [];
  } catch (error) {
    techDebtLogger.error('Error obteniendo eventos de Microsoft Calendar:', error);
    return [];
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: CalendarEventCreateInput,
  calendarId: string | null = null,
): Promise<CreatedGoogleCalendarEvent> {
  const targetCalendarId = calendarId || 'primary';

  const response = await fetchWithCircuitBreaker(
    'google-calendar-events',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: eventData.isAllDay
          ? { date: eventData.start.split('T')[0] }
          : { dateTime: eventData.start },
        end: eventData.isAllDay
          ? { date: eventData.end.split('T')[0] }
          : { dateTime: eventData.end },
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Error creando evento en Google Calendar');
  }

  return await response.json() as CreatedGoogleCalendarEvent;
}
