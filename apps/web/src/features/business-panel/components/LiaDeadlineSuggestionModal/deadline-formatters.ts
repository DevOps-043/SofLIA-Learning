import type { ApproachSuggestion, DeadlineT } from './types'

export function formatStudyPace(suggestion: ApproachSuggestion, t: DeadlineT): string {
  if (suggestion.duration_days <= 7) {
    const hoursPerDay = (suggestion.hours_per_week / 7).toFixed(1)
    return `${hoursPerDay} ${t('liaSuggestion.details.hoursPerDay', { defaultValue: 'horas/dia' })}`
  }

  return `${suggestion.hours_per_week} ${t('liaSuggestion.details.hoursPerWeek')}`
}

export function todayDateOnly(): string {
  return new Date().toISOString().split('T')[0]
}
