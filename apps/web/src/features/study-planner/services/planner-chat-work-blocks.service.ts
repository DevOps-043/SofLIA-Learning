import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
} from '../types/planner-schedule.types'

const WORK_BLOCK_TITLE_PATTERN =
  /(trabajo|work|oficina|jornada|laboral|shift|turno|servi[cç]o|expediente)/i
const WORK_BLOCK_EXCLUDE_PATTERN =
  /(junta|reuni[oó]n|reuni[aã]o|meeting|llamada|chamada|profundo|deep[\s-]?work|focus[\s-]?time|concentraci[oó]n)/i
const WORK_BLOCK_MIN_DURATION_MINUTES = 180

const dayNames: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}

const dayOfWeekToPlannerName: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
}

export function isWorkBlockEvent(event: StudyPlannerCalendarEventLike): boolean {
  const title = event.title ?? event.summary ?? ''
  if (!title) {
    return false
  }

  const rawStart = event.start ?? event.startTime
  const rawEnd = event.end ?? event.endTime
  if (!rawStart || !rawEnd) {
    return false
  }

  const start = new Date(rawStart as string)
  const end = new Date(rawEnd as string)
  const durationMinutes = (end.getTime() - start.getTime()) / 60000
  if (durationMinutes < WORK_BLOCK_MIN_DURATION_MINUTES) {
    return false
  }

  if (WORK_BLOCK_EXCLUDE_PATTERN.test(title)) {
    return false
  }

  return WORK_BLOCK_TITLE_PATTERN.test(title)
}

export function deriveCalendarStartTimesByDay(
  calendarData: StudyPlannerCalendarDataMap,
): Record<string, string> {
  return deriveCalendarTimesByDay(calendarData, 'start')
}

export function deriveCalendarEndTimesByDay(
  calendarData: StudyPlannerCalendarDataMap,
): Record<string, string> {
  return deriveCalendarTimesByDay(calendarData, 'end')
}

export function buildWorkBlockScheduleContext(
  calendarData: StudyPlannerCalendarDataMap,
): string {
  const workWindowByDayOfWeek: Record<number, { start: string; end: string }> = {}

  for (const dayData of Object.values(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) {
        continue
      }

      const rawStart = event.start ?? event.startTime
      const rawEnd = event.end ?? event.endTime
      if (!rawStart || !rawEnd) {
        continue
      }

      const startDate = new Date(rawStart as string)
      const endDate = new Date(rawEnd as string)
      const dow = startDate.getDay()

      if (!workWindowByDayOfWeek[dow]) {
        workWindowByDayOfWeek[dow] = {
          start: formatCalendarTime(startDate),
          end: formatCalendarTime(endDate),
        }
      }
    }
  }

  const entries = Object.entries(workWindowByDayOfWeek)
  if (entries.length === 0) {
    return ''
  }

  const lines = entries
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([dow, window]) =>
      `  - ${dayNames[Number(dow)] ?? `Dia ${dow}`}: trabajo de ${window.start} a ${window.end} -> agenda sesiones SOLO dentro de este horario`,
    )

  return [
    '\n\nHORARIO LABORAL DETECTADO EN CALENDARIO (RESTRICCION OBLIGATORIA):',
    'INSTRUCCION CRITICA: Las sesiones de estudio deben agendarse dentro del horario laboral.',
    'REGLA ESTRICTA PARA LA HORA DE FIN: la sesion debe terminar antes de que termine la jornada.',
    ...lines,
    'Si necesitas ajustar horas, mantente siempre dentro del bloque de trabajo del dia.',
  ].join('\n')
}

export function deriveWorkBlockDaysFromCalendar(
  calendarData: StudyPlannerCalendarDataMap,
): string[] {
  const dayOfWeekSet = new Set<number>()

  for (const dayData of Object.values(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) {
        continue
      }

      const rawStart = event.start ?? event.startTime
      if (!rawStart) {
        continue
      }

      dayOfWeekSet.add(new Date(rawStart as string).getDay())
    }
  }

  return [...dayOfWeekSet]
    .sort()
    .map((dow) => dayOfWeekToPlannerName[dow])
    .filter(Boolean)
}

function deriveCalendarTimesByDay(
  calendarData: StudyPlannerCalendarDataMap,
  side: 'start' | 'end',
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [dateStr, dayData] of Object.entries(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) {
        continue
      }

      const rawTime = side === 'start'
        ? event.start ?? event.startTime
        : event.end ?? event.endTime
      if (!rawTime) {
        continue
      }

      const time = formatCalendarTime(new Date(rawTime as string))
      if (!result[dateStr] || (side === 'start' ? time < result[dateStr] : time > result[dateStr])) {
        result[dateStr] = time
      }
    }
  }

  return result
}

function formatCalendarTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
