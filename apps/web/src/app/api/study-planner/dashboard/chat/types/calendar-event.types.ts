export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  isAllDay: boolean
  isStudySession: boolean
}
