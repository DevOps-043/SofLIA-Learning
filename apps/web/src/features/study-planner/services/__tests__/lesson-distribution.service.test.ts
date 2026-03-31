import { describe, it, expect } from 'vitest'
import {
  parsePlannerDateString,
  parsePlannerTimeString,
  formatPlannerTime24h,
  isHolidayDistributionDate,
  filterHolidayLessonDistributions,
  sortLessonDistributions,
} from '../lesson-distribution.service'
import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'

function makeDistribution(dateStr: string, startTime = '09:00'): StudyPlannerStoredLessonDistribution {
  return { dateStr, dayName: 'Lunes', startTime, endTime: '10:00', lessons: [] }
}

// ---------------------------------------------------------------------------
// parsePlannerDateString
// ---------------------------------------------------------------------------
describe('parsePlannerDateString', () => {
  it('parses ISO format YYYY-MM-DD', () => {
    const result = parsePlannerDateString('2025-06-15')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2025)
    expect(result?.getMonth()).toBe(5)
    expect(result?.getDate()).toBe(15)
  })

  it('parses DD/MM/YYYY format', () => {
    const result = parsePlannerDateString('15/06/2025')
    expect(result?.getFullYear()).toBe(2025)
    expect(result?.getMonth()).toBe(5)
    expect(result?.getDate()).toBe(15)
  })

  it('parses "15 de junio de 2025" format', () => {
    const result = parsePlannerDateString('15 de junio de 2025')
    expect(result?.getMonth()).toBe(5)
    expect(result?.getDate()).toBe(15)
    expect(result?.getFullYear()).toBe(2025)
  })

  it('parses "15 de ene" without year (uses current year)', () => {
    const result = parsePlannerDateString('15 de ene')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getMonth()).toBe(0)
    expect(result?.getDate()).toBe(15)
  })

  it('returns null for invalid date strings', () => {
    expect(parsePlannerDateString('not-a-date')).toBeNull()
    expect(parsePlannerDateString('')).toBeNull()
  })

  it('parses DD-MM-YYYY with dashes', () => {
    const result = parsePlannerDateString('01-03-2026')
    expect(result?.getFullYear()).toBe(2026)
    expect(result?.getMonth()).toBe(2)
    expect(result?.getDate()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// parsePlannerTimeString
// ---------------------------------------------------------------------------
describe('parsePlannerTimeString', () => {
  it('parses 24h HH:MM format', () => {
    const result = parsePlannerTimeString('09:30')
    expect(result).toEqual({ hours: 9, minutes: 30 })
  })

  it('parses plain hour without minutes', () => {
    const result = parsePlannerTimeString('14')
    expect(result?.hours).toBe(14)
    expect(result?.minutes).toBe(0)
  })

  it('parses 12h "9pm"', () => {
    const result = parsePlannerTimeString('9pm')
    expect(result?.hours).toBe(21)
  })

  it('parses "12am" as midnight (0)', () => {
    const result = parsePlannerTimeString('12am')
    expect(result?.hours).toBe(0)
  })

  it('parses "12pm" as noon (12)', () => {
    const result = parsePlannerTimeString('12pm')
    expect(result?.hours).toBe(12)
  })

  it('returns null for empty or non-string input', () => {
    expect(parsePlannerTimeString('')).toBeNull()
    expect(parsePlannerTimeString(null as unknown as string)).toBeNull()
  })

  it('returns null for string with no digits', () => {
    expect(parsePlannerTimeString('hola')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// formatPlannerTime24h
// ---------------------------------------------------------------------------
describe('formatPlannerTime24h', () => {
  it('formats hours and minutes with zero padding', () => {
    expect(formatPlannerTime24h(new Date(2025, 0, 1, 9, 5))).toBe('09:05')
    expect(formatPlannerTime24h(new Date(2025, 0, 1, 14, 30))).toBe('14:30')
  })

  it('formats midnight as 00:00', () => {
    expect(formatPlannerTime24h(new Date(2025, 0, 1, 0, 0))).toBe('00:00')
  })

  it('formats 23:59 correctly', () => {
    expect(formatPlannerTime24h(new Date(2025, 0, 1, 23, 59))).toBe('23:59')
  })
})

// ---------------------------------------------------------------------------
// isHolidayDistributionDate
// ---------------------------------------------------------------------------
describe('isHolidayDistributionDate', () => {
  it('identifies January 1 (New Year) as holiday', () => {
    expect(isHolidayDistributionDate('2026-01-01')).toBe(true)
  })

  it('identifies December 25 (Christmas) as holiday', () => {
    expect(isHolidayDistributionDate('2025-12-25')).toBe(true)
  })

  it('identifies May 1 (Labor Day) as holiday', () => {
    expect(isHolidayDistributionDate('2025-05-01')).toBe(true)
  })

  it('identifies September 16 as holiday', () => {
    expect(isHolidayDistributionDate('2025-09-16')).toBe(true)
  })

  it('does not flag a normal working day as holiday', () => {
    expect(isHolidayDistributionDate('2025-06-15')).toBe(false)
    expect(isHolidayDistributionDate('2025-03-10')).toBe(false)
  })

  it('returns false for invalid dates', () => {
    expect(isHolidayDistributionDate('invalid')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// filterHolidayLessonDistributions
// ---------------------------------------------------------------------------
describe('filterHolidayLessonDistributions', () => {
  it('removes distributions on holiday dates', () => {
    const distributions = [
      makeDistribution('2026-01-01'),
      makeDistribution('2025-06-15'),
      makeDistribution('2025-12-25'),
    ]
    const result = filterHolidayLessonDistributions(distributions)
    expect(result).toHaveLength(1)
    expect(result[0].dateStr).toBe('2025-06-15')
  })

  it('returns all items when none are holidays', () => {
    const distributions = [
      makeDistribution('2025-06-15'),
      makeDistribution('2025-06-16'),
    ]
    expect(filterHolidayLessonDistributions(distributions)).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(filterHolidayLessonDistributions([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// sortLessonDistributions
// ---------------------------------------------------------------------------
describe('sortLessonDistributions', () => {
  it('sorts by date ascending', () => {
    const distributions = [
      makeDistribution('2025-06-20'),
      makeDistribution('2025-06-10'),
      makeDistribution('2025-06-15'),
    ]
    const sorted = sortLessonDistributions(distributions)
    expect(sorted.map(d => d.dateStr)).toEqual(['2025-06-10', '2025-06-15', '2025-06-20'])
  })

  it('sorts by startTime when dates are equal', () => {
    const distributions = [
      makeDistribution('2025-06-15', '14:00'),
      makeDistribution('2025-06-15', '08:00'),
      makeDistribution('2025-06-15', '11:00'),
    ]
    const sorted = sortLessonDistributions(distributions)
    expect(sorted.map(d => d.startTime)).toEqual(['08:00', '11:00', '14:00'])
  })

  it('does not mutate the original array', () => {
    const distributions = [
      makeDistribution('2025-06-20'),
      makeDistribution('2025-06-10'),
    ]
    const original = [...distributions]
    sortLessonDistributions(distributions)
    expect(distributions[0].dateStr).toBe(original[0].dateStr)
  })

  it('handles single-element array', () => {
    const distributions = [makeDistribution('2025-06-15')]
    expect(sortLessonDistributions(distributions)).toHaveLength(1)
  })
})
