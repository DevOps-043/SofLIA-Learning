import type { NextFunction } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@/core/errors/app-error'

import { createCoursesController } from '../courses.controller'
import { CoursesService } from '../courses.service'
import { makeProgress, makeReq, makeRes } from './courses.fixtures'

vi.mock('../courses.service')

describe('courses controller progress flows', () => {
  let service: CoursesService
  let next: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CoursesService()
    next = vi.fn()
  })

  it('returns lesson progress for authenticated users', async () => {
    vi.mocked(service.getLessonProgress).mockResolvedValue(makeProgress())

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

  it('throws UnauthorizedError when there is no user', async () => {
    const controller = createCoursesController(service)
    const req = makeReq({
      user: undefined,
      params: { lessonId: 'lesson-1', courseId: 'course-1' },
    })

    await controller.getLessonProgress(req, makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })

  it('updates progress and returns result', async () => {
    vi.mocked(service.updateLessonProgress).mockResolvedValue(
      makeProgress({ progress_percent: 100, is_completed: true }),
    )

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
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })
})
