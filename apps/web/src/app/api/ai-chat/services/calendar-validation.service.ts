import type { ProposedScheduleSlot } from './study-schedule.service'

interface CalendarEvent {
  title?: string | null
  start?: string | null
  end?: string | null
  startTime?: string | null
  endTime?: string | null
}

export interface ScheduleConflict {
  date: string
  event: string
  time: string
}

export interface ScheduleValidationResult {
  hasConflicts: boolean
  conflicts: ScheduleConflict[]
}

interface ValidateScheduleParams {
  userId: string
  proposedSlots: ProposedScheduleSlot[]
  origin?: string
  baseUrl?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function buildCalendarEventsUrl({
  userId,
  origin,
  baseUrl = process.env.NEXT_PUBLIC_API_URL,
}: {
  userId: string
  origin?: string
  baseUrl?: string
}): string {
  const resolvedBaseUrl = baseUrl || origin || 'http://localhost:3000'
  const url = new URL('/api/study-planner/calendar/events', resolvedBaseUrl)
  url.searchParams.set('userId', userId)
  return url.toString()
}

export function detectScheduleConflicts(
  events: CalendarEvent[],
  proposedSlots: ProposedScheduleSlot[],
  locale = 'es-ES'
): ScheduleValidationResult {
  const conflicts: ScheduleConflict[] = []

  for (const slot of proposedSlots) {
    const slotDate = parseLocalDate(slot.date)
    const [startHour, startMin] = slot.startTime.split(':').map(Number)
    const [endHour, endMin] = slot.endTime.split(':').map(Number)

    const slotStart = new Date(slotDate)
    slotStart.setHours(startHour, startMin, 0, 0)

    const slotEnd = new Date(slotDate)
    slotEnd.setHours(endHour, endMin, 0, 0)

    for (const event of events) {
      const rawStart = event.start || event.startTime
      const rawEnd = event.end || event.endTime
      if (!rawStart || !rawEnd) {
        continue
      }

      const eventStart = new Date(rawStart)
      const eventEnd = new Date(rawEnd)

      const hasOverlap =
        (slotStart >= eventStart && slotStart < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (slotStart <= eventStart && slotEnd >= eventEnd)

      if (hasOverlap) {
        conflicts.push({
          date: slot.date,
          event: event.title || 'Evento sin título',
          time: `${eventStart.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${eventEnd.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        })
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  }
}

export async function validateProposedSchedule({
  userId,
  proposedSlots,
  origin,
  baseUrl,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: ValidateScheduleParams): Promise<ScheduleValidationResult> {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const calendarResponse = await fetchImpl(
      buildCalendarEventsUrl({ userId, origin, baseUrl }),
      {
        method: 'GET',
        signal: controller.signal,
      }
    )

    if (!calendarResponse.ok) {
      return { hasConflicts: false, conflicts: [] }
    }

    const payload = await calendarResponse.json() as { events?: CalendarEvent[] }
    return detectScheduleConflicts(payload.events || [], proposedSlots)
  } catch {
    return { hasConflicts: false, conflicts: [] }
  } finally {
    clearTimeout(timeoutHandle)
  }
}
