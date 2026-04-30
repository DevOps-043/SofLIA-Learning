/**
 * Utility for formatting dates consistently across the application.
 * Supports localization for Spanish, English, and Portuguese.
 */

export const getLocaleFromLanguage = (language: string): string => {
  if (language === 'en') return 'en-US'
  if (language === 'pt') return 'pt-BR'
  return 'es-MX'
}

export const formatDate = (
  date: Date | string | number,
  language: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(getLocaleFromLanguage(language), options)
}

export const formatShortDate = (
  date: Date | string | number,
  language: string
): string => {
  return formatDate(date, language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatTimeAgo = (
  dateString: string,
  language: string,
  t: (key: string, options?: any) => string
): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return t('dashboard.recentActivity.time.justNow', { defaultValue: 'Hace un momento' })
  if (diffMins < 60) return t('dashboard.recentActivity.time.minutesAgo', { time: diffMins, defaultValue: `Hace ${diffMins} min` })
  if (diffHours < 24) return t('dashboard.recentActivity.time.hoursAgo', { time: diffHours, defaultValue: `Hace ${diffHours} h` })
  if (diffDays === 1) return t('dashboard.recentActivity.time.daysAgo', { time: 1, defaultValue: 'Hace 1 dia' })
  if (diffDays < 7) return t('dashboard.recentActivity.time.daysAgo', { time: diffDays, defaultValue: `Hace ${diffDays} dias` })
  
  return formatDate(date, language, {
    day: 'numeric',
    month: 'short',
  })
}
