import type {
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types'

export function toDate(value: string | Date | undefined, fallback?: Date): Date {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    return new Date(value)
  }

  return fallback ? new Date(fallback) : new Date(Number.NaN)
}

export function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
}

export function eventTitle(event: StudyPlannerCalendarEventLike | undefined): string {
  return event?.title || event?.summary || 'Evento programado'
}

export function toCalendarEvent(event: StudyPlannerCalendarEventLike) {
  const start = event.start || event.startTime
  const end = event.end || event.endTime

  return {
    id: `${eventTitle(event)}-${String(start)}-${String(end)}`,
    title: eventTitle(event),
    description: event.description,
    startTime: String(start),
    endTime: String(end),
    isAllDay: Boolean(event.isAllDay),
    isRecurring: false,
    status: 'confirmed' as const,
  }
}

export function toSlotDateTime(slot: StudyPlannerStoredLessonDistribution, time: string): Date {
  const [yearRaw, monthRaw, dayRaw] = slot.dateStr.split('-')
  const [hourRaw, minuteRaw] = time.split(':')

  return new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
    Number.parseInt(hourRaw, 10),
    Number.parseInt(minuteRaw, 10),
    0,
    0,
  )
}
