export type CalendarProvider = 'google' | 'microsoft'

export interface CalendarIntegrationMetadata {
  secondary_calendar_id?: string
  selected_calendar_ids?: string[]
}

export interface CalendarIntegrationRecord {
  id: string
  user_id: string
  provider: CalendarProvider
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
  metadata?: CalendarIntegrationMetadata | null
}

export interface ExternalCalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  location: string
  status: string
  isAllDay: boolean
  calendarId?: string
  linkedStudySessionId?: string
  linkedStudyPlanId?: string
  linkedClientReferenceId?: string
}

export interface GoogleCalendarDateTimeValue {
  dateTime?: string
  date?: string
}

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: GoogleCalendarDateTimeValue
  end?: GoogleCalendarDateTimeValue
  location?: string
  status?: string
  extendedProperties?: {
    private?: {
      sofliaSessionId?: string
      sofliaPlanId?: string
      sofliaClientReferenceId?: string
    }
  }
}

export interface GoogleCalendarListItem {
  id: string
  summary?: string
  primary?: boolean
}

export interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[]
}

export interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[]
}

export interface MicrosoftCalendarDateTimeValue {
  dateTime?: string
}

export interface MicrosoftCalendarLocation {
  displayName?: string
}

export interface MicrosoftCalendarEvent {
  id: string
  subject?: string
  bodyPreview?: string
  start?: MicrosoftCalendarDateTimeValue
  end?: MicrosoftCalendarDateTimeValue
  location?: MicrosoftCalendarLocation
  showAs?: string
  isAllDay?: boolean
}

export interface MicrosoftCalendarEventsResponse {
  value?: MicrosoftCalendarEvent[]
}

export interface CalendarDateRange {
  startDate: Date
  endDate: Date
}

export interface RefreshAccessTokenResult {
  success: boolean
  accessToken?: string
}
