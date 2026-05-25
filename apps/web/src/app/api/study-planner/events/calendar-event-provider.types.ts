export interface ExternalCalendarEvent {
  id: string
  summary?: string
  description?: string | null
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  location?: string | null
  status?: string | null
}

export interface CreatedGoogleCalendarEvent {
  id: string
}

export interface CalendarEventCreateInput {
  title: string
  description?: string
  start: string
  end: string
  location?: string
  isAllDay?: boolean
}
