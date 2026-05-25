import type { DateLocale } from './date-utils.types'
import { relativeTimeMessages } from './relative-time.messages'

function interpolate(template: string, count: number) {
  return template.replace('{{count}}', count.toString())
}

function pluralized(singular: string, plural: string, count: number) {
  return count === 1 ? interpolate(singular, 1) : interpolate(plural, count)
}

export function formatRelativeTime(dateString: string, locale: DateLocale = 'es'): string {
  const messages = relativeTimeMessages[locale]

  try {
    const date = new Date(dateString)
    const diffMs = Date.now() - date.getTime()

    if (diffMs < 0 || Number.isNaN(diffMs)) {
      return messages.future
    }

    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSeconds < 60) return messages.now
    if (diffMinutes < 60) return pluralized(messages.minute, messages.minutes, diffMinutes)
    if (diffHours < 24) return pluralized(messages.hour, messages.hours, diffHours)
    if (diffDays < 7) return pluralized(messages.day, messages.days, diffDays)
    if (diffWeeks < 4) return pluralized(messages.week, messages.weeks, diffWeeks)
    if (diffMonths < 12) return pluralized(messages.month, messages.months, diffMonths)

    return pluralized(messages.year, messages.years, diffYears)
  } catch {
    return messages.fallback
  }
}
