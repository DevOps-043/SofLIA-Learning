/**
 * Date Utilities
 *
 * Provides functions for date formatting and relative time calculations
 *
 * @module date-utils
 */

/**
 * Formats a date string to relative time (e.g., "hace 2 días", "hace 3 horas")
 *
 * @param dateString - ISO date string or date string from database
 * @returns Formatted relative time string in Spanish
 *
 * @example
 * ```typescript
 * const createdAt = "2025-01-25T10:30:00.000Z"
 * const relative = formatRelativeTime(createdAt)
 * // Returns: "hace 2 días"
 * ```
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()

    // Calcular diferencia en milisegundos
    const diffMs = now.getTime() - date.getTime()

    // Si la fecha es futura o inválida, retornar "Ahora"
    if (diffMs < 0 || isNaN(diffMs)) {
      return 'Ahora'
    }

    // Convertir a diferentes unidades
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    // Retornar formato apropiado según el tiempo transcurrido
    if (diffSeconds < 60) {
      return 'Hace unos segundos'
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    } else if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    } else if (diffWeeks < 4) {
      return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`
    } else if (diffMonths < 12) {
      return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`
    } else {
      return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`
    }
  } catch (error) {
    // En caso de error, retornar string genérico
    return 'Hace algún tiempo'
  }
}

/**
 * Formats a date string to a readable format
 *
 * @param dateString - ISO date string or date string from database
 * @param format - Format type: 'full' | 'short' | 'time'
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate("2025-01-27T10:30:00.000Z", "full")
 * // Returns: "27 de enero de 2025"
 *
 * formatDate("2025-01-27T10:30:00.000Z", "short")
 * // Returns: "27/01/2025"
 *
 * formatDate("2025-01-27T10:30:00.000Z", "time")
 * // Returns: "10:30"
 * ```
 */
export function formatDate(
  dateString: string,
  format: 'full' | 'short' | 'time' = 'full'
): string {
  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return 'Fecha inválida'
    }

    switch (format) {
      case 'full': {
        const months = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ]
        const day = date.getDate()
        const month = months[date.getMonth()]
        const year = date.getFullYear()
        return `${day} de ${month} de ${year}`
      }

      case 'short': {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }

      case 'time': {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }

      default:
        return date.toLocaleDateString('es-ES')
    }
  } catch (error) {
    return 'Fecha inválida'
  }
}

/**
 * Checks if a date is today
 *
 * @param dateString - ISO date string or date string from database
 * @returns true if date is today, false otherwise
 */
export function isToday(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const today = new Date()

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  } catch (error) {
    return false
  }
}

/**
 * Checks if a date is within the last N days
 *
 * @param dateString - ISO date string or date string from database
 * @param days - Number of days to check
 * @returns true if date is within last N days, false otherwise
 */
export function isWithinDays(dateString: string, days: number): boolean {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return diffDays <= days && diffDays >= 0
  } catch (error) {
    return false
  }
}
