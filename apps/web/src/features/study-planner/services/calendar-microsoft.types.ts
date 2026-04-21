export interface MicrosoftUserProfile {
  mail?: string | null;
  userPrincipalName?: string | null;
}

export interface MicrosoftCalendarSummary {
  id: string;
  name?: string | null;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
  hexColor?: string;
}

export interface MicrosoftCalendarsResponse {
  value?: MicrosoftCalendarSummary[];
}

export interface MicrosoftEventDateTime {
  dateTime?: string;
}

export interface MicrosoftEventLocation {
  displayName?: string;
}

export interface MicrosoftCalendarEventRow {
  id: string;
  subject?: string | null;
  bodyPreview?: string | null;
  start?: MicrosoftEventDateTime | null;
  end?: MicrosoftEventDateTime | null;
  isAllDay?: boolean;
  seriesMasterId?: string | null;
  location?: MicrosoftEventLocation | null;
  showAs?: string | null;
}

export interface MicrosoftCalendarEventsResponse {
  value?: MicrosoftCalendarEventRow[];
}

export interface MicrosoftCreatedEventResponse {
  id: string;
}
