import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'
import { normalizeDayIdentifier } from './plan-adjustment-calendar-rules.service'
import type {
  StudyPlannerDateChangeRequest,
  StudyPlannerTimeChangeRequest,
} from './plan-adjustment.types'

export function extractTimeChangeRequest(
  message: string,
): StudyPlannerTimeChangeRequest | null {
  const timeChangePattern =
    /(?:cambiar|ajustar|modificar|poner|mover|cambiame).*?(?:las\s+)?(?:horas?\s+que\s+)?(?:iniciar|empiezan|comienzan|empiecen|comiencen)\s*(?:a\s+las?|a)?\s*(\d{1,2}).*?(?:por|a|por las|a las)\s*(\d{1,2})/i
  const match = message.match(timeChangePattern)

  if (match) {
    const oldHour = Number.parseInt(match[1], 10)
    const newHour = Number.parseInt(match[2], 10)

    if (oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23) {
      return { oldHour, newHour }
    }
  }

  const dayOfWeekPattern =
    /(?:lunes|martes|mi(?:e|\u00e9)rcoles|jueves|viernes|s(?:a|\u00e1)bado|domingo)\s+(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})/i
  if (dayOfWeekPattern.test(message)) {
    return null
  }

  const simplePattern = /(?:^|\s)(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})(?:\s|$)/i
  const simpleMatch = message.match(simplePattern)

  if (!simpleMatch) {
    return null
  }

  const oldHour = Number.parseInt(simpleMatch[1], 10)
  const newHour = Number.parseInt(simpleMatch[2], 10)

  return oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23
    ? { oldHour, newHour }
    : null
}

export function extractDateChangeRequest(
  message: string,
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
): StudyPlannerDateChangeRequest | null {
  const dayNames: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  }
  const dayNamesArr = [
    'Domingo',
    'Lunes',
    'Martes',
    'Mi\u00e9rcoles',
    'Jueves',
    'Viernes',
    'S\u00e1bado',
  ]

  const normalizedMessage = normalizeDayIdentifier(message || '')
  const dayPattern =
    /(?:del?|desde)\s+(?:(lunes|martes|miercoles|jueves|viernes|sabado|domingo))?\s*(\d{1,2})?\s+(?:al?|hacia|para el)\s+(?:(lunes|martes|miercoles|jueves|viernes|sabado|domingo))?\s*(\d{1,2})?/i
  const match = normalizedMessage.match(dayPattern)

  if (!match) {
    return null
  }

  const sourceDayWord = match[1] ? normalizeDayIdentifier(match[1]) : undefined
  const sourceNum = match[2] ? Number.parseInt(match[2], 10) : undefined
  const targetDayWord = match[3] ? normalizeDayIdentifier(match[3]) : undefined
  const targetNum = match[4] ? Number.parseInt(match[4], 10) : undefined

  if ((!sourceDayWord && !sourceNum) || (!targetDayWord && !targetNum)) {
    return null
  }

  let sourceMatch: string | null = null

  for (const slot of savedLessonDistribution) {
    const parts = slot.dateStr.split('-')
    const slotDate = new Date(
      Number.parseInt(parts[0], 10),
      Number.parseInt(parts[1], 10) - 1,
      Number.parseInt(parts[2], 10),
    )
    const dayOfMonth = slotDate.getDate()
    const dayOfWeek = normalizeDayIdentifier(slot.dayName || '')

    if (sourceNum && dayOfMonth === sourceNum) {
      sourceMatch = slot.dateStr
      break
    }

    if (sourceDayWord && dayOfWeek === sourceDayWord) {
      sourceMatch = slot.dateStr
      if (!sourceNum) {
        break
      }
    }
  }

  if (!sourceMatch) {
    return null
  }

  const sourceParts = sourceMatch.split('-')
  const sourceDate = new Date(
    Number.parseInt(sourceParts[0], 10),
    Number.parseInt(sourceParts[1], 10) - 1,
    Number.parseInt(sourceParts[2], 10),
  )
  const targetMatch = targetNum
    ? resolveTargetDateByDayOfMonth(sourceDate, targetNum)
    : resolveTargetDateByWeekday(sourceDate, targetDayWord, dayNames)

  if (!targetMatch) {
    return null
  }

  const targetParts = targetMatch.split('-')
  const targetDateObj = new Date(
    Number.parseInt(targetParts[0], 10),
    Number.parseInt(targetParts[1], 10) - 1,
    Number.parseInt(targetParts[2], 10),
  )

  return {
    sourceDate: sourceMatch,
    targetDate: targetMatch,
    sourceDayName: dayNamesArr[sourceDate.getDay()],
    targetDayName: dayNamesArr[targetDateObj.getDay()],
  }
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function resolveTargetDateByDayOfMonth(sourceDate: Date, targetNum: number): string {
  const targetDate = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), targetNum)
  if (targetDate < sourceDate) {
    targetDate.setMonth(targetDate.getMonth() + 1)
  }

  return formatDateKey(targetDate)
}

function resolveTargetDateByWeekday(
  sourceDate: Date,
  targetDayWord: string | undefined,
  dayNames: Record<string, number>,
): string | null {
  const targetDayNum = targetDayWord ? dayNames[targetDayWord] ?? -1 : -1

  if (targetDayNum < 0) {
    return null
  }

  const candidate = new Date(sourceDate)
  candidate.setHours(0, 0, 0, 0)
  for (let index = 0; index < 14; index += 1) {
    if (candidate.getDay() === targetDayNum && candidate.getTime() !== sourceDate.getTime()) {
      return formatDateKey(candidate)
    }

    candidate.setDate(candidate.getDate() + 1)
  }

  return null
}
