import { logger } from '@/lib/logger';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

function normalizeEventId(eventId: string): string {
  return eventId.split('_')[0];
}

export async function deleteGoogleEvent(
  accessToken: string,
  eventId: string,
  calendarId: string | null,
): Promise<boolean> {
  try {
    const cleanEventId = normalizeEventId(eventId);
    const targetCalendarId = calendarId || 'primary';
    const response = await fetchWithCircuitBreaker(
      'google-calendar',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (response.ok) return true;

    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallback = await fetchWithCircuitBreaker(
        'google-calendar',
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return fallback.ok || fallback.status === 404;
    }

    if (response.status === 404) return true;

    logger.warn('[Calendar] Error eliminando evento', { status: response.status });
    return false;
  } catch (error) {
    logger.warn('[Calendar] Error eliminando evento', { error });
    return false;
  }
}
