import {
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
import { buildTimedLayouts } from './study-planner-calendar-overlap.utils'
export { getEventPosition } from './study-planner-calendar-position.utils'

const ALL_DAY_POSITION: StudyPlannerCalendarEventPosition = {
  top: 0,
  height: 16,
  left: 0,
  width: 100,
  isAllDay: true,
}

export function getEventsForDay(
  events: CalendarEvent[],
  date: CalendarDate,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = toCalendarDate(event.start)
    const eventEnd = toCalendarDate(event.end)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    if (event.isAllDay) {
      const eventStartDay = startOfDay(eventStart)
      const eventEndDay = startOfDay(eventEnd)
      return (
        (isSameDay(date, eventStartDay) || isAfter(date, eventStartDay))
        && (isSameDay(date, eventEndDay) || isBefore(date, eventEndDay))
      )
    }

    return (
      (isSameDay(eventStart, dayEnd) || isBefore(eventStart, dayEnd))
      && (isSameDay(eventEnd, dayStart) || isAfter(eventEnd, dayStart))
    )
  })
}

export function getEventLayoutsForDay(
  events: CalendarEvent[],
  date: CalendarDate,
): (CalendarEvent & { position: StudyPlannerCalendarEventPosition })[] {
  const dayEvents = getEventsForDay(events, date)
  const timedEvents = dayEvents
    .filter((event) => !event.isAllDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      || new Date(a.end).getTime() - new Date(b.end).getTime())

  const allDayEventLayouts = dayEvents
    .filter((event) => event.isAllDay)
    .map((event) => ({ ...event, position: ALL_DAY_POSITION }))

  if (timedEvents.length === 0) return allDayEventLayouts

  const timedLayouts = buildTimedLayouts(timedEvents, date)
  return [...allDayEventLayouts, ...timedLayouts].sort((a, b) => {
    if (a.position.isAllDay && !b.position.isAllDay) return -1
    if (!a.position.isAllDay && b.position.isAllDay) return 1
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })
}
