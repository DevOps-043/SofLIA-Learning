import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculateStudyPlannerTotalLessonsNeeded } from '../planner-course-workload.service'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeMyCoursesResponse(courses: Array<{ course_id: string; courses?: { slug: string }; enrollment_id?: string }>) {
  return new Response(JSON.stringify({ courses }), { status: 200 })
}

function makeModulesResponse(lessons: Array<{ lesson_id: string; lesson_title: string; is_published?: boolean }>) {
  return new Response(JSON.stringify({ modules: [{ lessons }] }), { status: 200 })
}

function makeProgressResponse(completedLessonIds: string[]) {
  return new Response(JSON.stringify({ completedLessonIds }), { status: 200 })
}

describe('calculateStudyPlannerTotalLessonsNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 0 for empty selectedCourseIds', async () => {
    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: [] })
    expect(result).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns fallback (10 per course) when my-courses fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 500 }))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1', 'c2'] })

    expect(result).toBe(20) // 2 courses * 10
  })

  it('calculates remaining lessons from modules and progress', async () => {
    mockFetch
      .mockResolvedValueOnce(makeMyCoursesResponse([
        { course_id: 'c1', courses: { slug: 'course-1' }, enrollment_id: 'e1' },
      ]))
      .mockResolvedValueOnce(makeModulesResponse([
        { lesson_id: 'l1', lesson_title: 'Lesson 1' },
        { lesson_id: 'l2', lesson_title: 'Lesson 2' },
        { lesson_id: 'l3', lesson_title: 'Lesson 3' },
      ]))
      .mockResolvedValueOnce(makeProgressResponse(['l1']))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(2) // 3 lessons - 1 completed
  })

  it('excludes unpublished lessons', async () => {
    mockFetch
      .mockResolvedValueOnce(makeMyCoursesResponse([
        { course_id: 'c1', courses: { slug: 'course-1' } },
      ]))
      .mockResolvedValueOnce(makeModulesResponse([
        { lesson_id: 'l1', lesson_title: 'Published', is_published: true },
        { lesson_id: 'l2', lesson_title: 'Unpublished', is_published: false },
      ]))
      .mockResolvedValueOnce(makeProgressResponse([]))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(1) // only published
  })

  it('returns fallback when modules fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(makeMyCoursesResponse([
        { course_id: 'c1', courses: { slug: 'course-1' } },
      ]))
      .mockResolvedValueOnce(new Response('', { status: 500 })) // modules fail
      .mockResolvedValueOnce(makeProgressResponse([]))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(10) // fallback per course
  })

  it('handles fetch throwing error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(10) // fallback
  })

  it('handles course not found in my-courses list', async () => {
    mockFetch
      .mockResolvedValueOnce(makeMyCoursesResponse([
        { course_id: 'other-course', courses: { slug: 'other' } },
      ]))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(makeProgressResponse([]))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(10) // fallback since slug is null
  })

  it('handles response as array instead of object', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(
        JSON.stringify([{ course_id: 'c1', slug: 'course-1', enrollment_id: 'e1' }]),
        { status: 200 },
      ))
      .mockResolvedValueOnce(makeModulesResponse([
        { lesson_id: 'l1', lesson_title: 'L1' },
      ]))
      .mockResolvedValueOnce(makeProgressResponse([]))

    const result = await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds: ['c1'] })

    expect(result).toBe(1)
  })

  it('supports composite selected course ids from the planner selector', async () => {
    mockFetch
      .mockResolvedValueOnce(makeMyCoursesResponse([
        { course_id: 'c1', courses: { slug: 'course-1' }, enrollment_id: 'e1' },
      ]))
      .mockResolvedValueOnce(makeModulesResponse([
        { lesson_id: 'l1', lesson_title: 'Lesson 1' },
        { lesson_id: 'l2', lesson_title: 'Lesson 2' },
      ]))
      .mockResolvedValueOnce(makeProgressResponse([]))

    const result = await calculateStudyPlannerTotalLessonsNeeded({
      selectedCourseIds: ['c1__org-board'],
    })

    expect(result).toBe(2)
  })
})
