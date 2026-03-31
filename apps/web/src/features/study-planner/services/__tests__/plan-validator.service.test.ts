import { describe, it, expect } from 'vitest'
import {
  PlanValidatorService,
  type PlanValidationConfig,
} from '../plan-validator.service'

const FUTURE_DATE = new Date('2030-12-31')

function makeConfig(overrides: Partial<PlanValidationConfig> = {}): PlanValidationConfig {
  return {
    totalLessons: 10,
    availableSlots: 10,
    targetDate: FUTURE_DATE,
    userType: 'b2c',
    sessionDurationMinutes: 45,
    averageLessonDurationMinutes: 30,
    ...overrides,
  }
}

describe('PlanValidatorService.validatePlanFeasibility', () => {
  it('returns feasible when available minutes exceed required', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 5, availableSlots: 10 })
    )
    expect(result.isFeasible).toBe(true)
    expect(result.minutesMissing).toBe(0)
    expect(result.daysNeeded).toBe(0)
    expect(result.weeksNeeded).toBe(0)
    expect(result.suggestedNewDeadline).toBeUndefined()
  })

  it('returns feasible when minutes exactly match', () => {
    // 5 lessons × 45 min = 225 min required; 5 slots × 45 min = 225 min available
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 5, availableSlots: 5, averageLessonDurationMinutes: 45 })
    )
    expect(result.isFeasible).toBe(true)
    expect(result.minutesMissing).toBe(0)
  })

  it('returns not feasible when available minutes are insufficient', () => {
    // 20 lessons × 30 min = 600 min required; 5 slots × 45 min = 225 min available
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 20, availableSlots: 5 })
    )
    expect(result.isFeasible).toBe(false)
    expect(result.minutesMissing).toBeGreaterThan(0)
    expect(result.daysNeeded).toBeGreaterThan(0)
    expect(result.weeksNeeded).toBeGreaterThan(0)
  })

  it('calculates minutesRequired correctly', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 8, averageLessonDurationMinutes: 25 })
    )
    expect(result.minutesRequired).toBe(200) // 8 × 25
  })

  it('calculates minutesAvailable correctly', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ availableSlots: 6, sessionDurationMinutes: 50 })
    )
    expect(result.minutesAvailable).toBe(300) // 6 × 50
  })

  it('calculates feasibilityScore of 100 when fully covered', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 0 })
    )
    expect(result.feasibilityScore).toBe(100)
  })

  it('calculates feasibilityScore proportionally', () => {
    // required=300, available=150 → score=50%
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 10, availableSlots: 5, sessionDurationMinutes: 30, averageLessonDurationMinutes: 30 })
    )
    expect(result.feasibilityScore).toBeCloseTo(50, 0)
  })

  it('caps feasibilityScore at 100 when over-covered', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 2, availableSlots: 20 })
    )
    expect(result.feasibilityScore).toBe(100)
  })

  it('includes b2b reason when userType is b2b and infeasible', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 100, availableSlots: 1, userType: 'b2b' })
    )
    expect(result.reason).toContain('B2B')
  })

  it('includes b2c reason when userType is b2c and infeasible', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 100, availableSlots: 1, userType: 'b2c' })
    )
    expect(result.reason).not.toContain('B2B')
    expect(result.reason).toBeDefined()
  })

  it('has no reason when plan is feasible', () => {
    const result = PlanValidatorService.validatePlanFeasibility(makeConfig())
    expect(result.reason).toBeUndefined()
  })

  it('suggests a new deadline when infeasible', () => {
    const result = PlanValidatorService.validatePlanFeasibility(
      makeConfig({ totalLessons: 100, availableSlots: 1 })
    )
    expect(result.suggestedNewDeadline).toBeInstanceOf(Date)
    expect(result.suggestedNewDeadline!.getTime()).toBeGreaterThan(FUTURE_DATE.getTime())
  })
})

describe('PlanValidatorService.validateMultiCoursePlan', () => {
  const courses = [
    { courseId: 'c1', courseTitle: 'Curso A', lessonsCount: 5, averageLessonDuration: 30 },
    { courseId: 'c2', courseTitle: 'Curso B', lessonsCount: 5, averageLessonDuration: 30 },
  ]

  it('sums lesson counts from all courses', () => {
    const result = PlanValidatorService.validateMultiCoursePlan(courses, 100, FUTURE_DATE, 'b2c', 45)
    expect(result.minutesRequired).toBe(300) // 10 lessons × 30 min
  })

  it('returns feasible for sufficient slots', () => {
    const result = PlanValidatorService.validateMultiCoursePlan(courses, 10, FUTURE_DATE, 'b2c', 30)
    expect(result.isFeasible).toBe(true)
  })

  it('returns infeasible for insufficient slots', () => {
    const result = PlanValidatorService.validateMultiCoursePlan(courses, 1, FUTURE_DATE, 'b2c', 30)
    expect(result.isFeasible).toBe(false)
  })

  it('uses weighted average for mixed lesson durations', () => {
    const mixed = [
      { courseId: 'c1', courseTitle: 'A', lessonsCount: 2, averageLessonDuration: 60 },
      { courseId: 'c2', courseTitle: 'B', lessonsCount: 2, averageLessonDuration: 30 },
    ]
    const result = PlanValidatorService.validateMultiCoursePlan(mixed, 100, FUTURE_DATE, 'b2c', 45)
    // (2×60 + 2×30) / 4 = 45 min average → 4 lessons × 45 = 180 min
    expect(result.minutesRequired).toBe(180)
  })

  it('handles empty courses array', () => {
    const result = PlanValidatorService.validateMultiCoursePlan([], 5, FUTURE_DATE, 'b2c', 45)
    expect(result.isFeasible).toBe(true)
    expect(result.minutesRequired).toBe(0)
  })
})

describe('PlanValidatorService.calculateMaxLessons', () => {
  it('calculates max lessons correctly', () => {
    // 10 slots × 45 min = 450 min ÷ 30 min per lesson = 15 lessons
    expect(PlanValidatorService.calculateMaxLessons(10, 45, 30)).toBe(15)
  })

  it('floors the result (no partial lessons)', () => {
    // 450 min ÷ 40 min = 11.25 → floor = 11
    expect(PlanValidatorService.calculateMaxLessons(10, 45, 40)).toBe(11)
  })

  it('returns 0 for 0 slots', () => {
    expect(PlanValidatorService.calculateMaxLessons(0, 45, 30)).toBe(0)
  })

  it('uses default lesson duration of 30 minutes', () => {
    // 5 slots × 60 min = 300 ÷ 30 = 10
    expect(PlanValidatorService.calculateMaxLessons(5, 60)).toBe(10)
  })
})

describe('PlanValidatorService.suggestCoursesToRemove', () => {
  const courses = [
    { courseId: 'c1', courseTitle: 'A', lessonsCount: 3 },
    { courseId: 'c2', courseTitle: 'B', lessonsCount: 5 },
    { courseId: 'c3', courseTitle: 'C', lessonsCount: 2 },
  ]

  it('returns empty when all courses fit', () => {
    const result = PlanValidatorService.suggestCoursesToRemove(courses, 15)
    expect(result).toHaveLength(0)
  })

  it('suggests removing courses that do not fit', () => {
    // maxLessons=5: c3(2), then c1(3) → accumulated=5 → c2(5) does not fit
    const result = PlanValidatorService.suggestCoursesToRemove(courses, 5)
    expect(result).toContain('c2')
  })

  it('respects priority when provided (lower priority number = processed last in greedy pass)', () => {
    const prioritized = [
      { courseId: 'c1', courseTitle: 'A', lessonsCount: 3, priority: 1 },
      { courseId: 'c2', courseTitle: 'B', lessonsCount: 3, priority: 3 },
      { courseId: 'c3', courseTitle: 'C', lessonsCount: 3, priority: 2 },
    ]
    // Sort is descending by priority → [c2(p3), c3(p2), c1(p1)]
    // maxLessons=6: c2(3) fits (acc=3), c3(3) fits (acc=6), c1(3) does not fit → c1 is removed
    const result = PlanValidatorService.suggestCoursesToRemove(prioritized, 6)
    expect(result).toContain('c1')
    expect(result).not.toContain('c2')
  })

  it('returns all courses when maxLessons is 0', () => {
    const result = PlanValidatorService.suggestCoursesToRemove(courses, 0)
    expect(result).toHaveLength(courses.length)
  })
})

describe('PlanValidatorService.calculateRequiredDailyIntensity', () => {
  it('calculates daily minutes correctly', () => {
    // 10 lessons × 30 min = 300 min ÷ 10 days = 30 min/day
    expect(PlanValidatorService.calculateRequiredDailyIntensity(10, 10, 30)).toBe(30)
  })

  it('ceils fractional values', () => {
    // 10 × 30 = 300 ÷ 7 = 42.86 → ceil = 43
    expect(PlanValidatorService.calculateRequiredDailyIntensity(10, 7, 30)).toBe(43)
  })

  it('returns Infinity when no days available', () => {
    expect(PlanValidatorService.calculateRequiredDailyIntensity(10, 0, 30)).toBe(Infinity)
  })

  it('uses default lesson duration of 30 minutes', () => {
    expect(PlanValidatorService.calculateRequiredDailyIntensity(5, 5)).toBe(30)
  })

  it('returns 0 when there are no lessons', () => {
    expect(PlanValidatorService.calculateRequiredDailyIntensity(0, 10, 30)).toBe(0)
  })
})
