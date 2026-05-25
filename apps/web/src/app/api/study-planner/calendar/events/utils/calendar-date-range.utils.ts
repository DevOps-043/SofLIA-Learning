import { endOfDay, startOfDay } from 'date-fns'
import type { CalendarDateRange } from '../calendar-events.types'

const DEFAULT_RANGE_DAYS = 14

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime())
}

function isDateOnlyValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function parseRangeBoundary(
  value: string | null,
  fallback: Date,
  boundary: 'start' | 'end',
): Date {
  if (!value) {
    return fallback
  }

  const parsedDate = new Date(value)
  if (!isValidDate(parsedDate)) {
    return fallback
  }

  if (isDateOnlyValue(value)) {
    return boundary === 'start' ? startOfDay(parsedDate) : endOfDay(parsedDate)
  }

  return parsedDate
}

export function parseCalendarDateRange(
  requestUrl: string,
  now = new Date(),
): CalendarDateRange {
  const { searchParams } = new URL(requestUrl)
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')
  const defaultEndDate = new Date(
    now.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000,
  )

  return {
    startDate: parseRangeBoundary(startDateParam, new Date(now), 'start'),
    endDate: parseRangeBoundary(endDateParam, defaultEndDate, 'end'),
  }
}

export function parseTokenExpiry(expiresAt: unknown): Date | null {
  if (typeof expiresAt !== 'string' || !expiresAt) {
    return null
  }

  const parsedDate = new Date(expiresAt)
  return isValidDate(parsedDate) ? parsedDate : null
}

export function needsCalendarTokenRefresh(
  expiresAt: unknown,
  now = new Date(),
): boolean {
  const tokenExpiry = parseTokenExpiry(expiresAt)
  return !tokenExpiry || tokenExpiry <= now
}
