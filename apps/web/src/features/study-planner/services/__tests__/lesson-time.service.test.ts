import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { LessonTimeService } from '../lesson-time.service'

describe('LessonTimeService.getLessonDuration', () => {
  it('returns ceil of fractional minutes', () => {
    expect(LessonTimeService.getLessonDuration(10.3)).toBe(11)
    expect(LessonTimeService.getLessonDuration(10.0)).toBe(10)
    expect(LessonTimeService.getLessonDuration(0)).toBe(0)
  })

  it('rounds up already-integer values unchanged', () => {
    expect(LessonTimeService.getLessonDuration(45)).toBe(45)
    expect(LessonTimeService.getLessonDuration(1)).toBe(1)
  })

  it('rounds up sub-minute fractions', () => {
    expect(LessonTimeService.getLessonDuration(0.1)).toBe(1)
    expect(LessonTimeService.getLessonDuration(59.9)).toBe(60)
  })
})

describe('LessonTimeService.getTotalLessonsDuration', () => {
  it('returns 0 for an empty array', () => {
    expect(LessonTimeService.getTotalLessonsDuration([])).toBe(0)
  })

  it('sums a single lesson', () => {
    expect(LessonTimeService.getTotalLessonsDuration([{ totalMinutes: 15 }])).toBe(15)
  })

  it('sums multiple lessons applying ceil to each', () => {
    const lessons = [
      { totalMinutes: 10.5 },
      { totalMinutes: 20 },
      { totalMinutes: 5.1 },
    ]
    // ceil(10.5)=11, ceil(20)=20, ceil(5.1)=6 → 37
    expect(LessonTimeService.getTotalLessonsDuration(lessons)).toBe(37)
  })

  it('handles lessons with zero duration', () => {
    expect(LessonTimeService.getTotalLessonsDuration([{ totalMinutes: 0 }, { totalMinutes: 30 }])).toBe(30)
  })
})

describe('LessonTimeService.estimateCompletionTime', () => {
  it('calculates weeks needed for single session per week', () => {
    // 60 min total, 1 session/week × 60 min = 60 min/week → 1 week
    const result = LessonTimeService.estimateCompletionTime(60, 1, 60)
    expect(result.weeks).toBe(1)
    expect(result.estimatedEndDate).toBeInstanceOf(Date)
  })

  it('rounds up fractional weeks', () => {
    // 90 min total, 1 session/week × 60 min = 60 min/week → ceil(90/60)=2 weeks
    const result = LessonTimeService.estimateCompletionTime(90, 1, 60)
    expect(result.weeks).toBe(2)
  })

  it('handles multiple sessions per week correctly', () => {
    // 240 min total, 3 sessions/week × 30 min = 90 min/week → ceil(240/90)=3 weeks
    const result = LessonTimeService.estimateCompletionTime(240, 3, 30)
    expect(result.weeks).toBe(3)
  })

  it('returns a future estimated end date', () => {
    const before = new Date()
    const result = LessonTimeService.estimateCompletionTime(60, 1, 60)
    expect(result.estimatedEndDate.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('sets end date approximately N weeks from today', () => {
    const result = LessonTimeService.estimateCompletionTime(120, 2, 60)
    // 120 / (2*60) = 1 week exactly
    const today = new Date()
    const diff = result.estimatedEndDate.getTime() - today.getTime()
    const diffDays = diff / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(0)
    expect(diffDays).toBeLessThanOrEqual(8)
  })
})

describe('LessonTimeService.formatTime', () => {
  it('returns minutes-only for values < 60', () => {
    expect(LessonTimeService.formatTime(0)).toBe('0 min')
    expect(LessonTimeService.formatTime(30)).toBe('30 min')
    expect(LessonTimeService.formatTime(59)).toBe('59 min')
  })

  it('returns whole hours with no minutes suffix when divisible by 60', () => {
    expect(LessonTimeService.formatTime(60)).toBe('1h')
    expect(LessonTimeService.formatTime(120)).toBe('2h')
    expect(LessonTimeService.formatTime(180)).toBe('3h')
  })

  it('returns hours + minutes for non-divisible values', () => {
    expect(LessonTimeService.formatTime(90)).toBe('1h 30min')
    expect(LessonTimeService.formatTime(75)).toBe('1h 15min')
    expect(LessonTimeService.formatTime(150)).toBe('2h 30min')
  })

  it('handles exactly 1h 1min', () => {
    expect(LessonTimeService.formatTime(61)).toBe('1h 1min')
  })
})
