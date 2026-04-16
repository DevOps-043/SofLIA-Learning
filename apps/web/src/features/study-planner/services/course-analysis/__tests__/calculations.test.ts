import { describe, expect, it } from 'vitest'

import {
  buildCourseComplexity,
  buildLessonDurationFromEstimate,
  buildLessonDurationFromSources,
  calculateCourseComplexityScore,
  createPostgrestInFilter,
  getMaterialFallbackMinutes,
  getRecommendedSessionMinutes,
} from '../calculations'
import { INTERACTIONS_TIME_MINUTES } from '../constants'

describe('createPostgrestInFilter', () => {
  it('wraps values in quotes and parentheses', () => {
    const result = createPostgrestInFilter(['a', 'b', 'c'])
    expect(result).toBe('("a","b","c")')
  })

  it('escapes double quotes inside values', () => {
    const result = createPostgrestInFilter(['say "hello"'])
    expect(result).toBe('("say \\"hello\\"")')
  })

  it('handles single value', () => {
    const result = createPostgrestInFilter(['only-one'])
    expect(result).toBe('("only-one")')
  })
})

describe('getMaterialFallbackMinutes', () => {
  it('returns 10 for quiz', () => {
    expect(getMaterialFallbackMinutes('quiz')).toBe(10)
  })

  it('returns 15 for exercise', () => {
    expect(getMaterialFallbackMinutes('exercise')).toBe(15)
  })

  it('returns 10 for reading', () => {
    expect(getMaterialFallbackMinutes('reading')).toBe(10)
  })

  it('returns default for unknown type', () => {
    expect(getMaterialFallbackMinutes('other')).toBe(5)
  })

  it('returns default for null/undefined', () => {
    expect(getMaterialFallbackMinutes(null)).toBe(5)
    expect(getMaterialFallbackMinutes(undefined)).toBe(5)
  })
})

describe('calculateCourseComplexityScore', () => {
  it('starts at 5 for intermediate level', () => {
    const score = calculateCourseComplexityScore('intermediate', 20, 20)
    expect(score).toBe(5)
  })

  it('decreases by 2 for beginner level', () => {
    const score = calculateCourseComplexityScore('beginner', 20, 20)
    expect(score).toBe(3)
  })

  it('increases by 2 for advanced level', () => {
    const score = calculateCourseComplexityScore('advanced', 20, 20)
    expect(score).toBe(7)
  })

  it('increases by 1 when average lesson duration > 30 minutes', () => {
    const score = calculateCourseComplexityScore('intermediate', 31, 20)
    expect(score).toBe(6)
  })

  it('increases by 2 when average lesson duration > 45 minutes', () => {
    const score = calculateCourseComplexityScore('intermediate', 46, 20)
    expect(score).toBe(7)
  })

  it('decreases by 1 when average lesson duration < 15 minutes', () => {
    const score = calculateCourseComplexityScore('intermediate', 14, 20)
    expect(score).toBe(4)
  })

  it('increases by 1 when total lessons > 50', () => {
    const score = calculateCourseComplexityScore('intermediate', 20, 51)
    expect(score).toBe(6)
  })

  it('increases by 2 when total lessons > 100', () => {
    const score = calculateCourseComplexityScore('intermediate', 20, 101)
    expect(score).toBe(7)
  })

  it('decreases by 1 when total lessons < 10', () => {
    const score = calculateCourseComplexityScore('intermediate', 20, 9)
    expect(score).toBe(4)
  })

  it('clamps minimum score to 1', () => {
    const score = calculateCourseComplexityScore('beginner', 5, 3)
    expect(score).toBeGreaterThanOrEqual(1)
  })

  it('clamps maximum score to 10', () => {
    const score = calculateCourseComplexityScore('advanced', 60, 200)
    expect(score).toBeLessThanOrEqual(10)
  })
})

describe('getRecommendedSessionMinutes', () => {
  it('returns 45 min sessions for low complexity (≤3)', () => {
    const result = getRecommendedSessionMinutes(3)
    expect(result.recommendedSessionMinutes).toBe(45)
    expect(result.recommendedBreakMinutes).toBe(10)
  })

  it('returns 35 min sessions for medium complexity (4-6)', () => {
    const result = getRecommendedSessionMinutes(6)
    expect(result.recommendedSessionMinutes).toBe(35)
    expect(result.recommendedBreakMinutes).toBe(10)
  })

  it('returns 25 min sessions for high complexity (>6)', () => {
    const result = getRecommendedSessionMinutes(7)
    expect(result.recommendedSessionMinutes).toBe(25)
    expect(result.recommendedBreakMinutes).toBe(15)
  })
})

describe('buildLessonDurationFromEstimate', () => {
  const lesson = { lesson_id: 'l1', lesson_title: 'Intro', duration_seconds: 600 }
  const estimate = {
    lesson_id: 'l1',
    video_minutes: 10,
    activities_time_minutes: 5,
    reading_time_minutes: 3,
    quiz_time_minutes: 2,
    exercise_time_minutes: 4,
    link_time_minutes: 1,
    interactions_time_minutes: 3,
    total_time_minutes: 28,
  }

  it('maps lesson_id and title correctly', () => {
    const result = buildLessonDurationFromEstimate(lesson, estimate)
    expect(result.lessonId).toBe('l1')
    expect(result.lessonTitle).toBe('Intro')
  })

  it('sums materials minutes from reading + quiz + exercise + link', () => {
    const result = buildLessonDurationFromEstimate(lesson, estimate)
    expect(result.materialsMinutes).toBe(3 + 2 + 4 + 1)
  })

  it('marks isEstimated as false when estimate is provided', () => {
    const result = buildLessonDurationFromEstimate(lesson, estimate)
    expect(result.isEstimated).toBe(false)
  })

  it('falls back to 0 for null/undefined estimate values', () => {
    const emptyEstimate = { lesson_id: 'l1' }
    const result = buildLessonDurationFromEstimate(lesson, emptyEstimate)
    expect(result.videoMinutes).toBe(0)
    expect(result.activitiesMinutes).toBe(0)
    expect(result.materialsMinutes).toBe(0)
  })
})

describe('buildLessonDurationFromSources', () => {
  const lesson = { lesson_id: 'l1', lesson_title: 'Test', duration_seconds: 300 }

  it('calculates video minutes from duration_seconds', () => {
    const result = buildLessonDurationFromSources(lesson, [], [])
    expect(result.videoMinutes).toBe(5) // 300s / 60 = 5 min
  })

  it('adds INTERACTIONS_TIME_MINUTES to total', () => {
    const result = buildLessonDurationFromSources(lesson, [], [])
    expect(result.interactionsMinutes).toBe(INTERACTIONS_TIME_MINUTES)
    expect(result.totalMinutes).toBe(5 + INTERACTIONS_TIME_MINUTES)
  })

  it('sums activity times when provided', () => {
    const activities = [
      { lesson_id: 'l1', estimated_time_minutes: 10 },
      { lesson_id: 'l1', estimated_time_minutes: 15 },
    ]
    const result = buildLessonDurationFromSources(lesson, activities, [])
    expect(result.activitiesMinutes).toBe(25)
  })

  it('uses default time for activities without estimated_time', () => {
    const activities = [{ lesson_id: 'l1', estimated_time_minutes: null }]
    const result = buildLessonDurationFromSources(lesson, activities, [])
    expect(result.activitiesMinutes).toBe(5) // DEFAULT_ACTIVITY_TIME_MINUTES
    expect(result.isEstimated).toBe(true)
  })

  it('uses material type fallback for materials without estimated_time', () => {
    const materials = [{ lesson_id: 'l1', estimated_time_minutes: null, material_type: 'quiz' }]
    const result = buildLessonDurationFromSources(lesson, [], materials)
    expect(result.materialsMinutes).toBe(10) // quiz fallback
    expect(result.isEstimated).toBe(true)
  })

  it('marks isEstimated false when all times are explicit', () => {
    const activities = [{ lesson_id: 'l1', estimated_time_minutes: 10 }]
    const materials = [{ lesson_id: 'l1', estimated_time_minutes: 5, material_type: 'quiz' }]
    const result = buildLessonDurationFromSources(lesson, activities, materials)
    expect(result.isEstimated).toBe(false)
  })
})

describe('buildCourseComplexity', () => {
  const params = {
    courseId: 'course-1',
    level: 'intermediate' as const,
    category: 'technology',
    totalLessons: 20,
    totalModules: 5,
    totalDurationMinutes: 400,
    averageLessonDuration: 20,
  }

  it('returns all required fields', () => {
    const result = buildCourseComplexity(params)
    expect(result.courseId).toBe('course-1')
    expect(result.level).toBe('intermediate')
    expect(result.category).toBe('technology')
    expect(result.totalLessons).toBe(20)
    expect(result.totalModules).toBe(5)
    expect(result.totalDurationMinutes).toBe(400)
    expect(result.averageLessonDuration).toBe(20)
  })

  it('includes complexityScore in 1-10 range', () => {
    const result = buildCourseComplexity(params)
    expect(result.complexityScore).toBeGreaterThanOrEqual(1)
    expect(result.complexityScore).toBeLessThanOrEqual(10)
  })

  it('includes session and break recommendations', () => {
    const result = buildCourseComplexity(params)
    expect(result.recommendedSessionMinutes).toBeGreaterThan(0)
    expect(result.recommendedBreakMinutes).toBeGreaterThan(0)
  })

  it('produces shorter sessions for advanced courses', () => {
    const advancedResult = buildCourseComplexity({ ...params, level: 'advanced', averageLessonDuration: 50, totalLessons: 80 })
    const beginnerResult = buildCourseComplexity({ ...params, level: 'beginner', averageLessonDuration: 10, totalLessons: 5 })
    expect(advancedResult.recommendedSessionMinutes).toBeLessThanOrEqual(
      beginnerResult.recommendedSessionMinutes,
    )
  })
})
