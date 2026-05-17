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
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (response.ok) return true;

    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallback = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return fallback.ok || fallback.status === 404;
    }

    if (response.status === 404) return true;

    console.error('[Calendar] Error eliminando evento:', await response.text());
    return false;
  } catch (error) {
    console.error('[Calendar] Error eliminando evento:', error);
    return false;
  }
}
