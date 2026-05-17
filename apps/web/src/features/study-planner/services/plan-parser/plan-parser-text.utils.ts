import {
  DAY_PATTERN,
  MONTH_PATTERN,
} from './plan-parser.constants'

export function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasScheduleShape(text: string): boolean {
  return getScheduleDetectionPattern().test(normalizeComparableText(text))
}

export function isNonLessonLine(normalized: string): boolean {
  return (
    normalized.includes('total agrupado') ||
    normalized.includes('sesion de estudio') ||
    normalized.includes('sesiones de estudio') ||
    normalized.includes('sin lecciones asignadas') ||
    normalized.startsWith('resumen') ||
    normalized.startsWith('verificacion') ||
    normalized.includes('total de lecciones') ||
    normalized.includes('semanas de estudio') ||
    normalized.includes('fecha de finalizacion') ||
    normalized.includes('te parece bien') ||
    normalized.includes('horario exacto')
  )
}

function getScheduleDetectionPattern(): RegExp {
  return new RegExp(
    `(?:${DAY_PATTERN})\\s+\\d{1,2}|\\d{1,2}\\s*(?:de\\s+)?(?:${MONTH_PATTERN})|\\d{1,2}[\\/.\\-]\\d{1,2}(?:[\\/.\\-]\\d{4})?|\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?\\s*m\\.?|p\\.?\\s*m\\.?|am|pm)?\\s*(?:-|a|hasta)\\s*\\d{1,2}(?::\\d{2})?`,
    'i',
  )
}
