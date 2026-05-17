import type { DateFormat } from './date-utils.types'

const SPANISH_MONTHS = [
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

function formatShortDate(date: Date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

function formatTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

export function formatDate(dateString: string, format: DateFormat = 'full'): string {
  try {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return 'Fecha inválida'
    }

    if (format === 'short') {
      return formatShortDate(date)
    }

    if (format === 'time') {
      return formatTime(date)
    }

    if (format === 'full') {
      return `${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]} de ${date.getFullYear()}`
    }

    return date.toLocaleDateString('es-ES')
  } catch {
    return 'Fecha inválida'
  }
}
