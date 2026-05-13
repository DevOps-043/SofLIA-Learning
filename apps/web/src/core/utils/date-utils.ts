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
/**
 * Formats a date string to relative time (e.g., "hace 2 días", "2 days ago")
 *
 * @param dateString - ISO date string or date string from database
 * @param locale - Locale to use: 'es' | 'en' | 'pt'
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string, locale: 'es' | 'en' | 'pt' = 'es'): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (diffMs < 0 || isNaN(diffMs)) {
      return locale === 'es' ? 'Ahora' : locale === 'pt' ? 'Agora' : 'Just now'
    }

    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    const strings = {
      es: {
        now: 'Hace unos segundos',
        minute: 'Hace {{count}} minuto',
        minutes: 'Hace {{count}} minutos',
        hour: 'Hace {{count}} hora',
        hours: 'Hace {{count}} horas',
        day: 'Hace {{count}} día',
        days: 'Hace {{count}} días',
        week: 'Hace {{count}} semana',
        weeks: 'Hace {{count}} semanas',
        month: 'Hace {{count}} mes',
        months: 'Hace {{count}} meses',
        year: 'Hace {{count}} año',
        years: 'Hace {{count}} años',
        fallback: 'Hace algún tiempo'
      },
      en: {
        now: 'Just now',
        minute: '{{count}} minute ago',
        minutes: '{{count}} minutes ago',
        hour: '{{count}} hour ago',
        hours: '{{count}} hours ago',
        day: '{{count}} day ago',
        days: '{{count}} days ago',
        week: '{{count}} week ago',
        weeks: '{{count}} weeks ago',
        month: '{{count}} month ago',
        months: '{{count}} months ago',
        year: '{{count}} year ago',
        years: '{{count}} years ago',
        fallback: 'Some time ago'
      },
      pt: {
        now: 'Agora mesmo',
        minute: 'Há {{count}} minuto',
        minutes: 'Há {{count}} minutos',
        hour: 'Há {{count}} hora',
        hours: 'Há {{count}} horas',
        day: 'Há {{count}} dia',
        days: 'Há {{count}} dias',
        week: 'Há {{count}} semana',
        weeks: 'Há {{count}} semanas',
        month: 'Há {{count}} mês',
        months: 'Há {{count}} meses',
        year: 'Há {{count}} ano',
        years: 'Há {{count}} anos',
        fallback: 'Há algum tempo'
      }
    }

    const s = strings[locale]

    if (diffSeconds < 60) return s.now
    if (diffMinutes < 60) return diffMinutes === 1 ? s.minute.replace('{{count}}', '1') : s.minutes.replace('{{count}}', diffMinutes.toString())
    if (diffHours < 24) return diffHours === 1 ? s.hour.replace('{{count}}', '1') : s.hours.replace('{{count}}', diffHours.toString())
    if (diffDays < 7) return diffDays === 1 ? s.day.replace('{{count}}', '1') : s.days.replace('{{count}}', diffDays.toString())
    if (diffWeeks < 4) return diffWeeks === 1 ? s.week.replace('{{count}}', '1') : s.weeks.replace('{{count}}', diffWeeks.toString())
    if (diffMonths < 12) return diffMonths === 1 ? s.month.replace('{{count}}', '1') : s.months.replace('{{count}}', diffMonths.toString())
    return diffYears === 1 ? s.year.replace('{{count}}', '1') : s.years.replace('{{count}}', diffYears.toString())
  } catch (error) {
    return locale === 'es' ? 'Hace algún tiempo' : locale === 'pt' ? 'Há algum tempo' : 'Some time ago'
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
