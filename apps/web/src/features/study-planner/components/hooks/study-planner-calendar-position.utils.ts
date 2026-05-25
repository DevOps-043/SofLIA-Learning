import {
  differenceInMinutes,
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns'
import type { CalendarDate } from '../calendar/types'
import type {
  CalendarEvent,
  StudyPlannerCalendarEventPosition,
} from './study-planner-calendar.types'
import { toCalendarDate } from './study-planner-calendar.date'

export function getEventPosition(
  event: CalendarEvent,
  date: CalendarDate,
): StudyPlannerCalendarEventPosition | null {
  if (event.isAllDay) {
    return { top: 0, height: 16, left: 0, width: 100, isAllDay: true }
  }

  const eventStart = toCalendarDate(event.start)
  const eventEnd = toCalendarDate(event.end)
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  const overlapsDay = (
    (isSameDay(eventStart, dayEnd) || isBefore(eventStart, dayEnd))
    && (isSameDay(eventEnd, dayStart) || isAfter(eventEnd, dayStart))
  )

  if (!overlapsDay) {
    return null
  }

  const visibleStart = isBefore(eventStart, dayStart) ? dayStart : eventStart
  const visibleEnd = isAfter(eventEnd, dayEnd) ? dayEnd : eventEnd
  const startMinutes = visibleStart.getHours() * 60 + visibleStart.getMinutes()
  const durationMinutes = Math.max(
    differenceInMinutes(visibleEnd, visibleStart),
    0,
  )

  return {
    top: (startMinutes / 60) * 64,
    height: Math.max((durationMinutes / 60) * 64, 20),
    left: 0,
    width: 100,
    isAllDay: false,
  }
}
