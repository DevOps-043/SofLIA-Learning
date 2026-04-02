import { describe, expect, it } from 'vitest'
import {
  formatBusinessCourseDate,
  formatBusinessCourseDuration,
  formatBusinessCourseDurationSeconds,
  getBusinessCourseLevelStyles
} from '../business-course-detail-display.service'

describe('business-course-detail-display.service', () => {
  it('formats course durations for empty, minute and hour values', () => {
    expect(formatBusinessCourseDuration(null)).toBe('N/A')
    expect(formatBusinessCourseDuration(45)).toBe('45 min')
    expect(formatBusinessCourseDuration(135)).toBe('2h 15min')
  })

  it('formats lesson duration seconds as mm:ss', () => {
    expect(formatBusinessCourseDurationSeconds(125)).toBe('2:05')
  })

  it('maps known levels and preserves unknown labels', () => {
    expect(getBusinessCourseLevelStyles('principiante', '#111111', '#22AA44')).toMatchObject({
      text: 'Principiante',
      color: '#22AA44'
    })
    expect(getBusinessCourseLevelStyles('experto', '#111111', '#22AA44')).toMatchObject({
      text: 'experto',
      color: '#111111'
    })
  })

  it('formats dates in a human readable spanish locale string', () => {
    expect(formatBusinessCourseDate('2026-04-01T10:00:00.000Z')).toContain('2026')
  })
})
