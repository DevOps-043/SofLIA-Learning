export interface GoogleCalendarListItem {
  id: string;
  summary?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
}

export interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
}

export interface GoogleEventDate {
  dateTime?: string;
  date?: string;
}

export interface GoogleCalendarEventRow {
  id: string;
  summary?: string;
  description?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
  recurringEventId?: string;
  location?: string;
  status?: string;
}

export interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEventRow[];
}

export interface GoogleCreatedEventResponse {
  id: string;
  htmlLink?: string;
}

export interface GoogleEventUpdatePayload {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
}

export interface GoogleUserInfoResponse {
  email?: string | null;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
  backgroundColor?: string;
}
