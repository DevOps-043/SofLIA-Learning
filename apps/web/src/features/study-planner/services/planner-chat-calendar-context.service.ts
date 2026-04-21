import type { CalendarAvailability } from '../types/calendar-integration.types'
import type { StudyPlannerCalendarDataMap } from '../types/planner-schedule.types'
import {
  buildWorkBlockScheduleContext,
  deriveCalendarEndTimesByDay,
  deriveCalendarStartTimesByDay,
  deriveWorkBlockDaysFromCalendar,
} from './planner-chat-work-blocks.service'

interface CalendarEventRaw {
  id: string
  title: string
  startTime: string
  endTime: string
  isAllDay: boolean
  status: string
}

export {
  buildWorkBlockScheduleContext,
  deriveWorkBlockDaysFromCalendar,
} from './planner-chat-work-blocks.service'

export async function fetchCalendarEventsAsDataMap(): Promise<StudyPlannerCalendarDataMap | null> {
  try {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
    const response = await fetch(`/api/study-planner/calendar/availability?${params.toString()}`)
    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      success: boolean
      data?: {
        isConnected: boolean
        events: CalendarEventRaw[]
        availability?: CalendarAvailability[]
      }
    }

    if (!payload.success || !payload.data?.isConnected) {
      return null
    }

    return buildCalendarDataMap(
      payload.data.events ?? [],
      payload.data.availability ?? [],
    )
  } catch {
    return null
  }
}

export function buildFreeSlotsContext(calendarData: StudyPlannerCalendarDataMap): string {
  const dayNames: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miercoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado',
  }
  const lines: string[] = []
  let daysProcessed = 0

  for (const [dateStr, dayData] of Object.entries(calendarData).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (!dayData.availability || dayData.availability.freeSlots.length === 0) {
      continue
    }

    if (daysProcessed >= 10) {
      break
    }

    const dateObj = new Date(`${dateStr}T12:00:00Z`)
    const dayName = dayNames[dateObj.getDay()] ?? dateStr
    const slotStrings = dayData.availability.freeSlots.map((slot) => {
      const startH = slot.startHour.toString().padStart(2, '0')
      const startM = slot.startMinute.toString().padStart(2, '0')
      const endH = slot.endHour.toString().padStart(2, '0')
      const endM = slot.endMinute.toString().padStart(2, '0')
      return `${startH}:${startM}-${endH}:${endM}`
    })

    lines.push(`  - ${dayName} ${dateStr}: ${slotStrings.join(', ')}`)
    daysProcessed += 1
  }

  if (lines.length === 0) {
    return ''
  }

  return [
    '\n\nHUECOS LIBRES REALES (CALENDARIO):',
    'El analizador encontro los siguientes espacios 100% libres:',
    'INSTRUCCION CRITICA: acomoda las lecciones siempre dentro de estos espacios exactos.',
    ...lines,
  ].join('\n')
}

export function buildCalendarPlanningConstraints(calendarData: StudyPlannerCalendarDataMap): {
  calendarStartTimesByDay?: Record<string, string>
  calendarEndTimesByDay?: Record<string, string>
  availabilityMap: Record<string, CalendarAvailability>
} {
  const availabilityMap: Record<string, CalendarAvailability> = {}

  for (const [dateStr, dayData] of Object.entries(calendarData)) {
    if (dayData.availability) {
      availabilityMap[dateStr] = dayData.availability
    }
  }

  return {
    calendarStartTimesByDay: deriveCalendarStartTimesByDay(calendarData),
    calendarEndTimesByDay: deriveCalendarEndTimesByDay(calendarData),
    availabilityMap,
  }
}

function buildCalendarDataMap(
  events: CalendarEventRaw[],
  rawAvailability: CalendarAvailability[],
): StudyPlannerCalendarDataMap | null {
  const dataMap: StudyPlannerCalendarDataMap = {}

  for (const availability of rawAvailability) {
    dataMap[availability.date] = {
      busySlots: [],
      events: [],
      availability,
    }
  }

  for (const event of events) {
    if (!event.startTime) {
      continue
    }

    const dateKey = event.startTime.slice(0, 10)
    if (!dataMap[dateKey]) {
      dataMap[dateKey] = { busySlots: [], events: [] }
    }

    dataMap[dateKey].events.push({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
    })
  }

  return Object.keys(dataMap).length > 0 ? dataMap : null
}
