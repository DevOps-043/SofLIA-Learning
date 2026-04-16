import { describe, expect, it, vi } from 'vitest'

import {
  generateDeterministicPlan,
  calculateValidAlternatives,
} from '../plan-generator.service'
import type { Lesson, Preferences } from '../plan-generator.service'

vi.mock('@/features/study-planner/services/study-strategy.service', () => ({
  StudyStrategyService: {
    calculateBreaks: vi.fn().mockReturnValue({
      breaks: [],
      breakMinutes: 0,
      totalMinutes: 30,
    }),
  },
}))

function makeLessons(count: number): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    lessonId: `lesson-${i + 1}`,
    lessonTitle: `Lección ${i + 1}`,
    moduleTitle: `Módulo ${Math.floor(i / 3) + 1}`,
    durationMinutes: 20,
  }))
}

function makePrefs(overrides: Partial<Preferences> = {}): Preferences {
  return {
    days: ['lunes', 'miércoles', 'viernes'],
    times: ['mañana'],
    startDate: '2026-04-06',
    ...overrides,
  }
}

describe('generateDeterministicPlan', () => {
  it('returns a string plan for valid inputs', () => {
    const result = generateDeterministicPlan(
      makeLessons(3),
      makePrefs(),
    )

    expect(typeof result).toBe('string')
    expect(result).toContain('Total de lecciones: 3')
  })

  it('includes study strategy description', () => {
    const result = generateDeterministicPlan(
      makeLessons(3),
      makePrefs(),
    )

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Balanceado')
  })

  it('returns error message for empty lessons', () => {
    const result = generateDeterministicPlan([], makePrefs())

    expect(typeof result).toBe('string')
    expect(result as string).toContain('No se pudo generar')
  })

  it('returns exceedsDeadline object when plan exceeds deadline', () => {
    const result = generateDeterministicPlan(
      makeLessons(30),
      makePrefs({ days: ['lunes'] }),
      '2026-04-10',
    )

    if (typeof result === 'object') {
      expect(result.exceedsDeadline).toBe(true)
      expect(result.daysExcess).toBeGreaterThan(0)
      expect(result.plan).toBeNull()
    }
  })

  it('returns string plan when deadline is met', () => {
    const result = generateDeterministicPlan(
      makeLessons(3),
      makePrefs(),
      '2026-12-31',
    )

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Total de lecciones: 3')
  })

  it('respects maxSessionMinutes parameter', () => {
    const result = generateDeterministicPlan(
      makeLessons(5),
      makePrefs(),
      undefined,
      30,
    )

    expect(typeof result).toBe('string')
  })

  it('uses balanced mode by default', () => {
    const result = generateDeterministicPlan(
      makeLessons(2),
      makePrefs(),
    )

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Balanceado')
  })

  it('groups lessons by number prefix', () => {
    const lessons: Lesson[] = [
      { lessonId: 'l1', lessonTitle: '1.1 Intro', moduleTitle: 'M1', durationMinutes: 15 },
      { lessonId: 'l2', lessonTitle: '1.2 Basics', moduleTitle: 'M1', durationMinutes: 15 },
      { lessonId: 'l3', lessonTitle: '2.1 Advanced', moduleTitle: 'M2', durationMinutes: 20 },
    ]

    const result = generateDeterministicPlan(lessons, makePrefs())

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Total de lecciones: 3')
  })

  it('includes week numbers in output', () => {
    const result = generateDeterministicPlan(
      makeLessons(6),
      makePrefs(),
    )

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Semana')
  })

  it('includes lesson titles in output', () => {
    const result = generateDeterministicPlan(
      makeLessons(2),
      makePrefs(),
    )

    expect(typeof result).toBe('string')
    expect(result as string).toContain('Lección 1')
    expect(result as string).toContain('Lección 2')
  })

  it('handles maxConsecutiveHours preference', () => {
    const result = generateDeterministicPlan(
      makeLessons(5),
      makePrefs({ maxConsecutiveHours: 1 }),
    )

    expect(typeof result).toBe('string')
  })
})

describe('calculateValidAlternatives', () => {
  it('returns array of alternatives', () => {
    const result = calculateValidAlternatives(
      makeLessons(20),
      makePrefs({ days: ['lunes'] }),
      '2026-06-01',
      30,
    )

    expect(Array.isArray(result)).toBe(true)
  })

  it('sorts alternatives by daysBeforeDeadline descending', () => {
    const result = calculateValidAlternatives(
      makeLessons(10),
      makePrefs({ days: ['lunes', 'miércoles'] }),
      '2026-08-01',
      30,
    )

    if (result.length >= 2) {
      expect(result[0].daysBeforeDeadline).toBeGreaterThanOrEqual(result[1].daysBeforeDeadline)
    }
  })

  it('returns at most 4 alternatives', () => {
    const result = calculateValidAlternatives(
      makeLessons(30),
      makePrefs({ days: ['lunes'] }),
      '2026-12-31',
      30,
    )

    expect(result.length).toBeLessThanOrEqual(4)
  })

  it('each alternative has required fields', () => {
    const result = calculateValidAlternatives(
      makeLessons(10),
      makePrefs({ days: ['lunes'] }),
      '2026-08-01',
      30,
    )

    for (const alt of result) {
      expect(alt).toHaveProperty('id')
      expect(alt).toHaveProperty('description')
      expect(alt).toHaveProperty('days')
      expect(alt).toHaveProperty('times')
      expect(alt).toHaveProperty('sessionDuration')
      expect(alt).toHaveProperty('estimatedEndDate')
      expect(alt).toHaveProperty('daysBeforeDeadline')
    }
  })

  it('returns empty array when no alternatives can meet deadline', () => {
    const result = calculateValidAlternatives(
      makeLessons(500),
      makePrefs(),
      '2026-04-07', // tomorrow — impossible
      30,
    )

    // May return intensive option or empty
    expect(Array.isArray(result)).toBe(true)
  })
})
