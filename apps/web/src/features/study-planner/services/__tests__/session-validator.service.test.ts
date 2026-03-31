import { describe, it, expect, vi } from 'vitest'

// Mock server-only modules pulled in via LessonTimeService → supabase/server
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/features/study-planner/services/lesson-time.service', () => ({
  LessonTimeService: { analyzeCoursesTime: vi.fn() },
}))

import { SessionValidatorService } from '../session-validator.service'

describe('SessionValidatorService.validateSchedule', () => {
  it('returns valid for a proper schedule', () => {
    const result = SessionValidatorService.validateSchedule(['lunes', 'miercoles', 'viernes'], 1, 45, 10)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails with no selected days', () => {
    const result = SessionValidatorService.validateSchedule([], 1, 45, 10)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails when session is less than 20 minutes', () => {
    const result = SessionValidatorService.validateSchedule(['lunes'], 1, 15, 5)
    expect(result.isValid).toBe(false)
    expect(result.canFitMinSession).toBe(false)
  })

  it('calculates totalWeeklyMinutes correctly', () => {
    // 3 days × 2 blocks × 45 min = 270
    const result = SessionValidatorService.validateSchedule(['lunes', 'martes', 'miercoles'], 2, 45, 10)
    expect(result.totalWeeklyMinutes).toBe(270)
  })

  it('calculates sessionsPerWeek correctly', () => {
    // 4 days × 2 blocks = 8 sessions
    const result = SessionValidatorService.validateSchedule(['lunes', 'martes', 'miercoles', 'jueves'], 2, 30, 5)
    expect(result.sessionsPerWeek).toBe(8)
  })

  it('warns when fewer than 3 days are selected', () => {
    const result = SessionValidatorService.validateSchedule(['lunes', 'martes'], 1, 45, 10)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('warns when all 7 days are selected', () => {
    const result = SessionValidatorService.validateSchedule(
      ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      1,
      45,
      10
    )
    expect(result.warnings.some(w => w.includes('fatiga') || w.includes('descanso'))).toBe(true)
  })

  it('warns when total weekly minutes are less than 60', () => {
    // 1 day × 1 block × 30 min = 30 min
    const result = SessionValidatorService.validateSchedule(['lunes'], 1, 30, 5)
    expect(result.warnings.some(w => w.includes('1 hora') || w.includes('hora'))).toBe(true)
  })
})

describe('SessionValidatorService.calculateBreakSchedule', () => {
  it('returns a single short break for sessions ≤35 min', () => {
    const breaks = SessionValidatorService.calculateBreakSchedule(30)
    expect(breaks).toHaveLength(1)
    expect(breaks[0].breakDurationMinutes).toBe(5)
    expect(breaks[0].breakAfterMinutes).toBe(30)
  })

  it('returns a mid-session break for sessions between 36-60 min', () => {
    const breaks = SessionValidatorService.calculateBreakSchedule(60)
    expect(breaks).toHaveLength(1)
    expect(breaks[0].breakDurationMinutes).toBe(10)
  })

  it('returns multiple breaks for sessions between 61-90 min', () => {
    const breaks = SessionValidatorService.calculateBreakSchedule(90)
    expect(breaks.length).toBeGreaterThan(0)
    expect(breaks[0].breakDurationMinutes).toBe(15)
  })

  it('returns 20-min breaks for sessions >90 min', () => {
    const breaks = SessionValidatorService.calculateBreakSchedule(120)
    expect(breaks.length).toBeGreaterThan(0)
    expect(breaks[0].breakDurationMinutes).toBe(20)
  })

  it('sets sessionDurationMinutes on each break entry', () => {
    const sessionMinutes = 45
    const breaks = SessionValidatorService.calculateBreakSchedule(sessionMinutes)
    breaks.forEach(b => {
      expect(b.sessionDurationMinutes).toBe(sessionMinutes)
    })
  })

  it('returns at least one break for any positive session length', () => {
    [20, 35, 36, 60, 61, 90, 91, 150].forEach(mins => {
      const breaks = SessionValidatorService.calculateBreakSchedule(mins)
      expect(breaks.length).toBeGreaterThan(0)
    })
  })
})

describe('SessionValidatorService.getTotalSessionWithBreaks', () => {
  it('adds break time to session time for short sessions', () => {
    // 30 min session + 5 min break = 35 min
    const total = SessionValidatorService.getTotalSessionWithBreaks(30)
    expect(total).toBe(35)
  })

  it('returns more than the session duration', () => {
    const session = 60
    const total = SessionValidatorService.getTotalSessionWithBreaks(session)
    expect(total).toBeGreaterThan(session)
  })

  it('includes all breaks for long sessions', () => {
    const session = 90
    const total = SessionValidatorService.getTotalSessionWithBreaks(session)
    const breaks = SessionValidatorService.calculateBreakSchedule(session)
    const breakTime = breaks.reduce((sum, b) => sum + b.breakDurationMinutes, 0)
    expect(total).toBe(session + breakTime)
  })
})

describe('SessionValidatorService.validateTimeSlot', () => {
  it('returns valid for a proper time slot', () => {
    const result = SessionValidatorService.validateTimeSlot(9, 11, 30)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when start is equal to end', () => {
    const result = SessionValidatorService.validateTimeSlot(10, 10, 30)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails when start is after end', () => {
    const result = SessionValidatorService.validateTimeSlot(14, 10, 30)
    expect(result.isValid).toBe(false)
  })

  it('fails when slot is shorter than min session', () => {
    // 1 hour = 60 min, but min session is 90 min
    const result = SessionValidatorService.validateTimeSlot(9, 10, 90)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('90'))).toBe(true)
  })

  it('warns for very late hours (≥22)', () => {
    const result = SessionValidatorService.validateTimeSlot(22, 23, 30)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('warns for very early hours (<5)', () => {
    const result = SessionValidatorService.validateTimeSlot(3, 5, 30)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('warns when block exceeds 3 hours', () => {
    const result = SessionValidatorService.validateTimeSlot(8, 12, 30)
    expect(result.warnings.some(w => w.includes('3 hora') || w.includes('agotador'))).toBe(true)
  })

  it('does not warn for normal working hours', () => {
    const result = SessionValidatorService.validateTimeSlot(10, 12, 30)
    expect(result.warnings.filter(w => w.includes('tarde') || w.includes('temprano'))).toHaveLength(0)
  })
})
