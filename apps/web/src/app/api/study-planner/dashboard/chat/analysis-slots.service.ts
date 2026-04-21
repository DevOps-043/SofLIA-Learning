import { formatDate, formatTime } from './format.utils'
import type { CalendarEvent } from './types'

const WORK_BLOCK_TITLE_PATTERN =
  /(trabajo|work|oficina|jornada|laboral|shift|turno|servi[cç]o|expediente)/i
const WORK_BLOCK_EXCLUDE_PATTERN =
  /(junta|reunion|meeting|llamada|chamada|profundo|deep[\s-]?work|focus[\s-]?time|concentracion)/i
const WORK_BLOCK_MIN_DURATION_MINUTES = 180

export function isWorkBlockEvent(
  event: Pick<CalendarEvent, 'title' | 'start' | 'end'>,
): boolean {
  const durationMinutes =
    (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000

  if (durationMinutes < WORK_BLOCK_MIN_DURATION_MINUTES) {
    return false
  }

  if (WORK_BLOCK_EXCLUDE_PATTERN.test(event.title)) {
    return false
  }

  return WORK_BLOCK_TITLE_PATTERN.test(event.title)
}

function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function findAlternativeSlots(
  _date: Date,
  durationMinutes: number,
  calendarEvents: CalendarEvent[],
  sessions: Array<{ start_time: string; end_time: string }>,
): string[] {
  const alternatives: string[] = []
  const now = new Date()
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

  for (let dayOffset = 0; dayOffset <= 14 && alternatives.length < 3; dayOffset += 1) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + dayOffset)
    checkDate.setHours(0, 0, 0, 0)
    const dateKey = getDateKey(checkDate)

    const dayCalEvents = calendarEvents.filter(
      (event) => getDateKey(new Date(event.start)) === dateKey,
    )
    const daySessions = sessions.filter(
      (session) => getDateKey(new Date(session.start_time)) === dateKey,
    )

    const busyEvents: Array<{ start: string; end: string }> = [
      ...dayCalEvents
        .filter((event) => !isWorkBlockEvent(event))
        .map((event) => ({ start: event.start, end: event.end })),
      ...daySessions.map((session) => ({
        start: session.start_time,
        end: session.end_time,
      })),
    ]

    const workBlocks = dayCalEvents.filter(isWorkBlockEvent)

    if (workBlocks.length > 0) {
      for (const workBlock of workBlocks) {
        if (alternatives.length >= 3) {
          break
        }

        const workBlockStart = new Date(workBlock.start).getTime()
        const workBlockEnd = new Date(workBlock.end).getTime()
        const busyInBlock = busyEvents
          .filter(
            (event) =>
              new Date(event.start).getTime() < workBlockEnd
              && new Date(event.end).getTime() > workBlockStart,
          )
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime(),
          )

        let cursor = workBlockStart
        const sentinels: Array<{ start: string; end: string }> = [
          ...busyInBlock,
          {
            start: new Date(workBlockEnd).toISOString(),
            end: new Date(workBlockEnd).toISOString(),
          },
        ]

        for (const busy of sentinels) {
          if (alternatives.length >= 3) {
            break
          }

          const gapEnd = new Date(busy.start).getTime()
          const gapMinutes = (gapEnd - cursor) / 60000
          if (gapMinutes >= durationMinutes) {
            const slotStart = new Date(cursor)
            const slotEnd = new Date(cursor + durationMinutes * 60000)
            if (slotStart.getTime() > now.getTime()) {
              alternatives.push(
                `${dayNames[slotStart.getDay()]} ${formatDate(slotStart)}, ${formatTime(slotStart)} - ${formatTime(slotEnd)} (dentro de bloque de trabajo)`,
              )
            }
          }

          cursor = Math.max(cursor, new Date(busy.end).getTime())
        }
      }
    } else {
      const windows = [
        { start: 8, end: 12 },
        { start: 12, end: 18 },
        { start: 18, end: 22 },
      ]

      for (const window of windows) {
        if (alternatives.length >= 3) {
          break
        }

        const slotStart = new Date(checkDate)
        slotStart.setHours(window.start, 0, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)

        if (slotEnd.getHours() > window.end) {
          continue
        }

        if (slotStart.getTime() <= now.getTime()) {
          continue
        }

        const hasConflict = busyEvents.some(
          (event) =>
            new Date(event.start).getTime() < slotEnd.getTime()
            && new Date(event.end).getTime() > slotStart.getTime(),
        )

        if (!hasConflict) {
          alternatives.push(
            `${dayNames[slotStart.getDay()]} ${formatDate(slotStart)}, ${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
          )
        }
      }
    }
  }

  if (alternatives.length === 0) {
    alternatives.push('Revisa tu calendario para encontrar un horario libre')
  }

  return alternatives
}
