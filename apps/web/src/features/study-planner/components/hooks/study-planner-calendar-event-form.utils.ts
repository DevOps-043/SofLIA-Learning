import {
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from 'date-fns'
import type { CalendarDate } from '../calendar/types'
import { DEFAULT_EVENT_FORM } from './study-planner-calendar.constants'
import type {
  CalendarEvent,
  StudyPlannerCalendarEventForm,
} from './study-planner-calendar.types'

export function buildEventFormFromEvent(
  event: CalendarEvent,
): StudyPlannerCalendarEventForm {
  return {
    title: event.title,
    description: event.description || '',
    start: event.start,
    end: event.end,
    location: event.location || '',
    isAllDay: event.isAllDay || false,
    color: event.color || '#0066CC',
  }
}

export function buildDefaultEventFormForDate(
  currentDate: CalendarDate,
): StudyPlannerCalendarEventForm {
  const baseDate = startOfDay(currentDate)
  const defaultStart = setSeconds(
    setMinutes(setHours(baseDate, 9), 0),
    0,
  )
  const defaultEnd = setSeconds(
    setMinutes(setHours(baseDate, 10), 0),
    0,
  )

  return {
    ...DEFAULT_EVENT_FORM,
    start: defaultStart.toISOString(),
    end: defaultEnd.toISOString(),
  }
}
