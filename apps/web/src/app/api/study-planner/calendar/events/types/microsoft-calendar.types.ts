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
