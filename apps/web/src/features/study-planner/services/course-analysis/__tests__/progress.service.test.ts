import { describe, expect, it } from 'vitest'

import {
  buildCourseProgressMap,
  createDefaultCourseProgress,
} from '../progress.service'
import type { CourseLessonCountRow, UserCourseProgressSummaryRow } from '../types'

describe('createDefaultCourseProgress', () => {
  it('returns zero-value defaults', () => {
    const result = createDefaultCourseProgress()
    expect(result.progressPercentage).toBe(0)
    expect(result.completedLessons).toBe(0)
    expect(result.totalLessons).toBe(0)
    expect(result.lastAccessedAt).toBeUndefined()
  })
})

describe('buildCourseProgressMap', () => {
  const lessonCountRows: CourseLessonCountRow[] = [
    {
      course_id: 'c1',
      course_lessons: [
        { lesson_id: 'l1', is_published: true },
        { lesson_id: 'l2', is_published: true },
        { lesson_id: 'l3', is_published: false },
      ],
    },
    {
      course_id: 'c2',
      course_lessons: [
        { lesson_id: 'l4', is_published: true },
      ],
    },
  ]

  const progressRows: UserCourseProgressSummaryRow[] = [
    {
      course_id: 'c1',
      progress_percentage: 50,
      completed_lessons_count: 1,
      last_accessed_at: '2026-04-01T10:00:00Z',
    },
  ]

  it('creates a map with entries for each courseId', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1', 'c2'],
      lessonCountRows,
      progressRows,
    })

    expect(result.size).toBe(2)
    expect(result.has('c1')).toBe(true)
    expect(result.has('c2')).toBe(true)
  })

  it('counts only published lessons in totalLessons', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1'],
      lessonCountRows,
      progressRows,
    })

    expect(result.get('c1')!.totalLessons).toBe(2) // l3 is unpublished
  })

  it('maps progress data from progressRows', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1'],
      lessonCountRows,
      progressRows,
    })

    const c1 = result.get('c1')!
    expect(c1.progressPercentage).toBe(50)
    expect(c1.completedLessons).toBe(1)
    expect(c1.lastAccessedAt).toBe('2026-04-01T10:00:00Z')
  })

  it('defaults to zeros when no progress row exists', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c2'],
      lessonCountRows,
      progressRows,
    })

    const c2 = result.get('c2')!
    expect(c2.progressPercentage).toBe(0)
    expect(c2.completedLessons).toBe(0)
    expect(c2.lastAccessedAt).toBeUndefined()
  })

  it('deduplicates courseIds', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1', 'c1', 'c1'],
      lessonCountRows,
      progressRows,
    })

    expect(result.size).toBe(1)
  })

  it('filters out empty courseIds', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1', '', 'c2'],
      lessonCountRows,
      progressRows,
    })

    expect(result.size).toBe(2)
    expect(result.has('')).toBe(false)
  })

  it('handles empty lesson count rows', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1'],
      lessonCountRows: [],
      progressRows,
    })

    expect(result.get('c1')!.totalLessons).toBe(0)
  })

  it('handles null course_lessons in lesson count row', () => {
    const result = buildCourseProgressMap({
      courseIds: ['c1'],
      lessonCountRows: [{ course_id: 'c1', course_lessons: null }],
      progressRows: [],
    })

    expect(result.get('c1')!.totalLessons).toBe(0)
  })
})
