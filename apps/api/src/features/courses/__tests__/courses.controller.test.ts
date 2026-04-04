import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@/core/errors/app-error'

import { createCoursesController } from '../courses.controller'
import { CoursesService } from '../courses.service'
import type { CourseListItem, LessonProgress } from '../courses.types'

vi.mock('../courses.service')

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { id: 'user-1', email: 'test@test.com', role: 'BusinessUser' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request
}

function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

function makeCourse(): CourseListItem {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: null,
    category: null,
    level: null,
    instructor_id: null,
    duration_total_minutes: null,
    thumbnail_url: null,
    slug: 'test-course',
    is_active: true,
    price: null,
    average_rating: null,
    student_count: null,
    review_count: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    instructor: null,
  }
}

function makeProgress(): LessonProgress {
  return {
    progress_id: 'progress-1',
    lesson_id: 'lesson-1',
    user_id: 'user-1',
    enrollment_id: 'enrollment-1',
    progress_percent: 50,
    time_spent_seconds: 300,
    is_completed: false,
    last_position: 0,
    completed_at: null,
    updated_at: '2026-01-01T00:00:00Z',
    last_accessed_at: '2026-01-01T00:00:00Z',
    lesson_status: 'in_progress',
    video_progress_percentage: 50,
    quiz_completed: false,
    quiz_passed: false,
  }
}

describe('courses controller', () => {
  let service: CoursesService
  let next: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CoursesService()
    next = vi.fn()
  })

  describe('listCourses', () => {
    it('returns paginated courses', async () => {
      const mockResult = {
        courses: [makeCourse()],
        total: 1,
        page: 1,
        limit: 50,
        total_pages: 1,
      }
      vi.mocked(service.getCourses).mockResolvedValue(mockResult)

      const controller = createCoursesController(service)
      const req = makeReq({ query: {} })
      const res = makeRes()

      await controller.listCourses(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockResult })
    })
  })

  describe('getCourseBySlug', () => {
    it('returns course by slug', async () => {
      const course = makeCourse()
      vi.mocked(service.getCourseBySlug).mockResolvedValue(course)

      const controller = createCoursesController(service)
      const req = makeReq({ params: { slug: 'test-course' } })
      const res = makeRes()

      await controller.getCourseBySlug(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true, data: course })
    })
  })

  describe('getLessonProgress', () => {
    it('returns lesson progress for authenticated user', async () => {
      const progress = makeProgress()
      vi.mocked(service.getLessonProgress).mockResolvedValue(progress)

      const controller = createCoursesController(service)
      const req = makeReq({ params: { lessonId: 'lesson-1', courseId: 'course-1' } })
      const res = makeRes()

      await controller.getLessonProgress(req, res, next)

      expect(service.getLessonProgress).toHaveBeenCalledWith(
        'user-1',
        'course-1',
        'lesson-1',
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('throws UnauthorizedError when no user', async () => {
      const controller = createCoursesController(service)
      const req = makeReq({ user: undefined, params: { lessonId: 'lesson-1', courseId: 'course-1' } })
      const res = makeRes()

      await controller.getLessonProgress(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
    })
  })

  describe('updateLessonProgress', () => {
    it('updates progress and returns result', async () => {
      const progress = makeProgress({ progress_percent: 100, is_completed: true })
      vi.mocked(service.updateLessonProgress).mockResolvedValue(progress)

      const controller = createCoursesController(service)
      const req = makeReq({
        params: { lessonId: 'lesson-1', courseId: 'course-1' },
        body: { progressPercent: 100, isCompleted: true },
      })
      const res = makeRes()

      await controller.updateLessonProgress(req, res, next)

      expect(service.updateLessonProgress).toHaveBeenCalledWith(
        'user-1',
        'course-1',
        'lesson-1',
        { progressPercent: 100, isCompleted: true },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      )
    })
  })

  describe('getUserEnrollments', () => {
    it('returns user enrollments', async () => {
      vi.mocked(service.getUserEnrollments).mockResolvedValue([
        { course_id: 'course-1', enrolled_at: '2026-01-01T00:00:00Z' },
      ])

      const controller = createCoursesController(service)
      const req = makeReq()
      const res = makeRes()

      await controller.getUserEnrollments(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ course_id: 'course-1', enrolled_at: '2026-01-01T00:00:00Z' }],
      })
    })
  })
})
