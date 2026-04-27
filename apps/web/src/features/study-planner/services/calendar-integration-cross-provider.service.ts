import type { CalendarEvent } from '../types/user-context.types';
import { CalendarAuthService } from './calendar-auth.service';
import { CalendarDbService } from './calendar-db.service';
import { CalendarGoogleService } from './calendar-google.service';
import { CalendarMicrosoftService } from './calendar-microsoft.service';

export async function getCalendarEventsForUser(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const accessToken = await CalendarAuthService.refreshTokenIfNeeded(userId);

  if (!accessToken) {
    return [];
  }

  const integration = await CalendarDbService.getCalendarIntegration(userId);

  if (!integration || !integration.isConnected) {
    return [];
  }

  const selectedCalendarIds = await CalendarDbService.getSelectedCalendarIds(userId);

  if (integration.provider === 'google') {
    const secondaryCalendarId = await CalendarDbService.getSecondaryCalendarId(userId);
    const calendarIds =
      selectedCalendarIds && selectedCalendarIds.length > 0
        ? [
            ...selectedCalendarIds,
            ...(secondaryCalendarId && !selectedCalendarIds.includes(secondaryCalendarId)
              ? [secondaryCalendarId]
              : []),
          ]
        : undefined;

    return CalendarGoogleService.getGoogleCalendarEvents(
      accessToken,
      startDate,
      endDate,
      calendarIds,
    );
  }

  return CalendarMicrosoftService.getMicrosoftCalendarEvents(
    accessToken,
    startDate,
    endDate,
    selectedCalendarIds || undefined,
  );
}

export async function getCalendarIdForUser(userId: string): Promise<{
  calendarId: string | null;
  accessToken: string | null;
  provider: 'google' | 'microsoft' | null;
}> {
  const accessToken = await CalendarAuthService.refreshTokenIfNeeded(userId);
  if (!accessToken) {
    return { calendarId: null, accessToken: null, provider: null };
  }

  const integration = await CalendarDbService.getCalendarIntegration(userId);
  if (!integration || !integration.isConnected) {
    return { calendarId: null, accessToken: null, provider: null };
  }

  if (integration.provider !== 'google') {
    return { calendarId: null, accessToken, provider: integration.provider };
  }

  let calendarId = await CalendarDbService.getSecondaryCalendarId(userId);

  if (!calendarId) {
    calendarId = await CalendarGoogleService.getOrCreatePlatformCalendar(accessToken);
    if (calendarId) {
      await CalendarDbService.saveSecondaryCalendarId(userId, calendarId);
    }
  }

  return { calendarId, accessToken, provider: integration.provider };
}
