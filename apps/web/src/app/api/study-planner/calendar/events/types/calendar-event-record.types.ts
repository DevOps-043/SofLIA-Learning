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
