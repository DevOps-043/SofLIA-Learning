import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError } from '@/core/errors/app-error'

import { CoursesService } from '../courses.service'
import type { CoursesRepository } from '../courses.repository'
import { makeCourse, makeRepository, makeProgress } from './courses.fixtures'

describe('CoursesService', () => {
  let service: CoursesService
  let repository: CoursesRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = makeRepository()
    service = new CoursesService(repository)
  })

  describe('getCourses', () => {
    it('returns paginated courses list', async () => {
      const courses = [makeCourse(), makeCourse({ id: 'course-2', slug: 'test-2' })]
      vi.mocked(repository.findCourses).mockResolvedValue({ courses, total: 2 })

      const result = await service.getCourses({ limit: 50, offset: 0, isActive: true, orderBy: 'created_at', orderDirection: 'desc' })

      expect(result.courses).toHaveLength(2)
      expect(result).toMatchObject({ total: 2, page: 1 })
    })

    it('calculates total_pages correctly', async () => {
      vi.mocked(repository.findCourses).mockResolvedValue({ courses: [], total: 105 })

      const result = await service.getCourses({ limit: 50, offset: 0, isActive: true, orderBy: 'created_at', orderDirection: 'desc' })

      expect(result.total_pages).toBe(3)
    })

    it('returns empty list when no courses', async () => {
      const result = await service.getCourses({ limit: 50, offset: 0, isActive: true, orderBy: 'created_at', orderDirection: 'desc' })

      expect(result.courses).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getCourseBySlug', () => {
    it('returns course when found', async () => {
      const course = makeCourse({ slug: 'my-course' })
      vi.mocked(repository.findCourseBySlug).mockResolvedValue(course)

      const result = await service.getCourseBySlug('my-course')

      expect(result.slug).toBe('my-course')
      expect(repository.findCourseBySlug).toHaveBeenCalledWith('my-course')
    })

    it('propagates NotFoundError from repository', async () => {
      vi.mocked(repository.findCourseBySlug).mockRejectedValue(
        new NotFoundError('Curso no encontrado: missing'),
      )

      await expect(service.getCourseBySlug('missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getLessonProgress', () => {
    it('returns null when no progress exists', async () => {
      const result = await service.getLessonProgress('user-1', 'course-1', 'lesson-1')
      expect(result).toBeNull()
    })

    it('returns progress when found', async () => {
      const progress = makeProgress({ progress_percent: 75 })
      vi.mocked(repository.findLessonProgress).mockResolvedValue(progress)

      const result = await service.getLessonProgress('user-1', 'course-1', 'lesson-1')

      expect(result?.progress_percent).toBe(75)
    })
  })

  describe('updateLessonProgress', () => {
    it('upserts progress correctly', async () => {
      const progress = makeProgress({ progress_percent: 100, is_completed: true })
      vi.mocked(repository.upsertLessonProgress).mockResolvedValue(progress)

      const result = await service.updateLessonProgress('user-1', 'course-1', 'lesson-1', {
        progressPercent: 100,
        isCompleted: true,
      })

      expect(result).toMatchObject({ is_completed: true, progress_percent: 100 })
    })

    it('passes all fields to repository', async () => {
      await service.updateLessonProgress('user-1', 'course-1', 'lesson-1', {
        progressPercent: 50,
        timeSpentSeconds: 300,
        lastPosition: 150,
      })

      expect(repository.upsertLessonProgress).toHaveBeenCalledWith(
        'user-1',
        'course-1',
        'lesson-1',
        expect.objectContaining({ progressPercent: 50 }),
      )
    })
  })

  describe('getUserEnrollments', () => {
    it('returns empty array when no enrollments', async () => {
      const result = await service.getUserEnrollments('user-1')
      expect(result).toHaveLength(0)
    })

    it('returns enrollments list', async () => {
      vi.mocked(repository.findUserEnrollments).mockResolvedValue([
        { course_id: 'course-1', enrolled_at: '2026-01-01T00:00:00Z' },
        { course_id: 'course-2', enrolled_at: '2026-01-15T00:00:00Z' },
      ])

      const result = await service.getUserEnrollments('user-1')

      expect(result.map((item) => item.course_id)).toEqual(['course-1', 'course-2'])
    })
  })
})
