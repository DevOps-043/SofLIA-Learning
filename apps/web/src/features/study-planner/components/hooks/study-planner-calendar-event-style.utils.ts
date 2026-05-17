import { DEFAULT_EVENT_COLOR } from './study-planner-calendar.constants'
import type { CalendarEvent } from './study-planner-calendar.types'

export function getEventColor(event: CalendarEvent): string {
  if (event.color) {
    return event.color
  }
  if (event.source === 'study_session') {
    return '#8E24AA'
  }
  if (event.provider === 'google') {
    return '#0066CC'
  }
  if (event.provider === 'microsoft') {
    return '#0078D4'
  }
  return DEFAULT_EVENT_COLOR
}
