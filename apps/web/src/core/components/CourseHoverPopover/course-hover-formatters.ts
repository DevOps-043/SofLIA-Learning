import type { CourseWithInstructor } from '../../../features/courses/services/course.service'

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function formatDuration(minutes: number | undefined) {
  if (!minutes) return 'Duración no disponible'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''} ${mins} minuto${mins > 1 ? 's' : ''}`
  }

  if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`
  }

  return `${mins} minuto${mins > 1 ? 's' : ''}`
}

export function formatLevel(level: string | undefined) {
  if (!level) return 'Todos los niveles'

  const levelMap: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    all: 'Todos los niveles',
  }

  return levelMap[level.toLowerCase()] || level
}

export function getUpdateDate(course: CourseWithInstructor) {
  if (!course.updatedAt) {
    return 'Recientemente actualizado'
  }

  const date = new Date(course.updatedAt)
  return `Actualizado ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`
}

export function truncateDescription(text: string | undefined, maxLength = 200) {
  if (!text) return 'Sin descripción disponible.'
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength).trim()}...`
}
