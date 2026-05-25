import { DEFAULT_EVENT_COLOR } from './study-planner-calendar.constants'
import type { CalendarEvent } from './study-planner-calendar.types'

export function getEventColor(event: CalendarEvent): string {
  if (event.color) {
    return event.color
  }
  if (event.source === 'study_session') {
    return 'var(--color-legacy-8e24aa)'
  }
  if (event.provider === 'google') {
    return 'var(--color-legacy-0066cc)'
  }
  if (event.provider === 'microsoft') {
    return 'var(--color-legacy-0078d4)'
  }
  return DEFAULT_EVENT_COLOR
}
