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
