export interface CalendarContext {
  accessToken: string;
  provider: 'google' | 'microsoft';
  calendarId: string | null;
  userId: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  eventId?: string;
}

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface CalendarEventUpdateData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}
