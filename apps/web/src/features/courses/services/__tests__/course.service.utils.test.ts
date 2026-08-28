import { describe, expect, it } from 'vitest'
import { CourseDifficulty } from '@aprende-y-aplica/shared'
import {
  extractFavoriteCourseIds,
  extractPurchasedCourseIds,
  formatCoursePrice,
  getInstructorInfo,
  mapCourseDifficulty,
  mapCourseRowToCourse,
} from '../course.service.utils'

describe('mapCourseDifficulty', () => {
  it('maps known difficulty labels', () => {
    expect(mapCourseDifficulty('advanced')).toBe(CourseDifficulty.ADVANCED)
    expect(mapCourseDifficulty('intermedio')).toBe(CourseDifficulty.INTERMEDIATE)
  })

  it('falls back to beginner when level is missing', () => {
    expect(mapCourseDifficulty(undefined)).toBe(CourseDifficulty.BEGINNER)
  })
})

describe('formatCoursePrice', () => {
  it('formats numeric prices', () => {
    expect(formatCoursePrice(199.9)).toBe('MX$200')
  })

  it('returns zero for nullish prices', () => {
    expect(formatCoursePrice(null)).toBe('MX$0')
    expect(formatCoursePrice(undefined)).toBe('MX$0')
  })
})

describe('getInstructorInfo', () => {
  it('builds a display name from first and last name', () => {
    expect(
      getInstructorInfo({
        id: 'i1',
        first_name: 'Ana',
        last_name: 'Perez',
        username: 'aperez',
      }),
    ).toEqual({
      name: 'Ana Perez',
    })
  })

  it('returns the fallback when instructor is missing', () => {
    expect(getInstructorInfo(null)).toEqual({
      name: 'Instructor',
    })
  })
})

describe('favorite and purchase extraction', () => {
  it('extracts favorite course ids when the query succeeds', () => {
    expect(
      extractFavoriteCourseIds({
        data: [{ course_id: 'c1' }, { course_id: 'c2' }],
        error: null,
      }),
    ).toEqual(['c1', 'c2'])
  })

  it('prefers active purchases and falls back when none are active', () => {
    expect(
      extractPurchasedCourseIds({
        data: [
          { course_id: 'c1', access_status: 'inactive' },
          { course_id: 'c2', access_status: 'active' },
        ],
        error: null,
      }),
    ).toEqual(['c2'])

    expect(
      extractPurchasedCourseIds({
        data: [
          { course_id: 'c3', access_status: 'inactive' },
          { course_id: 'c4', access_status: 'expired' },
        ],
        error: null,
      }),
    ).toEqual(['c3', 'c4'])
  })
})

describe('mapCourseRowToCourse', () => {
  it('maps a database row to the UI contract', () => {
    const mapped = mapCourseRowToCourse(
      {
        id: 'course-1',
        title: 'Type Safety',
        description: 'Refactor module',
        category: 'Engineering',
        level: 'advanced',
        instructor_id: 'instructor-1',
        duration_total_minutes: 90,
        thumbnail_url: 'thumb.png',
        slug: 'type-safety',
        is_active: true,
        price: 249,
        average_rating: 4.8,
        student_count: 18,
        review_count: 6,
        learning_objectives: ['Tipos', 'Testing'],
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-02T10:00:00.000Z',
        instructor: {
          id: 'instructor-1',
          first_name: 'Lia',
          last_name: 'Coach',
          username: 'lia',
        },
      },
      {
        isFavorite: true,
        status: 'Adquirido',
      },
    )

    expect(mapped.difficulty).toBe(CourseDifficulty.ADVANCED)
    expect(mapped.status).toBe('Adquirido')
    expect(mapped.isFavorite).toBe(true)
    expect(mapped.instructor_name).toBe('Lia Coach')
    expect(mapped.learning_objectives).toEqual(['Tipos', 'Testing'])
  })
})
