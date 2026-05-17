import type { NextFunction, Request } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCoursesController } from '../courses.controller'
import { CoursesService } from '../courses.service'
import { makeCourse, makeReq, makeRes } from './courses.fixtures'

vi.mock('../courses.service')

describe('courses controller list flows', () => {
  let service: CoursesService
  let next: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CoursesService()
    next = vi.fn()
  })

  it('returns paginated courses', async () => {
    const result = {
      courses: [makeCourse()],
      total: 1,
      page: 1,
      limit: 50,
      total_pages: 1,
    }
    vi.mocked(service.getCourses).mockResolvedValue(result)

    const controller = createCoursesController(service)
    const res = makeRes()

    await controller.listCourses(makeReq({ query: {} }), res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: result })
  })

  it('returns course by slug', async () => {
    const course = makeCourse()
    vi.mocked(service.getCourseBySlug).mockResolvedValue(course)

    const controller = createCoursesController(service)
    const res = makeRes()

    await controller.getCourseBySlug(
      makeReq({ params: { slug: 'test-course' } }) as Request,
      res,
      next,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: course })
  })

  it('returns user enrollments', async () => {
    const enrollments = [
      { course_id: 'course-1', enrolled_at: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(service.getUserEnrollments).mockResolvedValue(enrollments)

    const controller = createCoursesController(service)
    const res = makeRes()

    await controller.getUserEnrollments(makeReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: enrollments })
  })
})
