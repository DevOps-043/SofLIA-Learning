import type { ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED } from './constants'

export function calculateDaysBetween(
  startValue: string | null | undefined,
  endValue: string | null | undefined,
): number | null {
  if (!startValue || !endValue) return null

  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null
  }

  const days = (end.getTime() - start.getTime()) / 86_400_000
  return Math.max(0, Math.round(days * 10) / 10)
}

export function calculateAge(
  dateOfBirth: string | null | undefined,
  today = new Date(),
): number | null {
  if (!dateOfBirth) return null

  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`)
  if (Number.isNaN(birthDate.getTime())) return null

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth()
  const dayDiff = today.getUTCDate() - birthDate.getUTCDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1
  return age >= 0 ? age : null
}

export function getAgeBand(age: number | null): string {
  if (age === null) return REPORTS_ANALYTICS_UNSPECIFIED
  if (age < 18) return 'under_18'
  if (age <= 24) return '18_24'
  if (age <= 34) return '25_34'
  if (age <= 44) return '35_44'
  if (age <= 54) return '45_54'
  return '55_plus'
}

export function getProgressBand(progress: number): string {
  if (progress >= 100) return 'completed'
  if (progress >= 76) return 'almost_done'
  if (progress >= 51) return 'high'
  if (progress >= 26) return 'medium'
  if (progress > 0) return 'low'
  return 'not_started'
}

export function normalizeDimension(value: string | null | undefined): string {
  const normalized = value?.trim()
  return normalized ? normalized : REPORTS_ANALYTICS_UNSPECIFIED
}

export function resolveLastConnectionAt(
  lastLoginAt: string | null | undefined,
  updatedAt: string | null | undefined,
): string | null {
  return lastLoginAt || updatedAt || null
}

export function isDateWithinPeriod(
  value: string | null | undefined,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): boolean {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date >= new Date(filters.from) && date <= new Date(filters.to)
}

export function isAnyDateWithinPeriod(
  values: Array<string | null | undefined>,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): boolean {
  return values.some((value) => isDateWithinPeriod(value, filters))
}
