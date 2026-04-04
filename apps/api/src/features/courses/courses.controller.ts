import type { Request, RequestHandler, Response } from 'express'

import { UnauthorizedError } from '@/core/errors/app-error'
import { asyncHandler } from '@/core/middleware/error.middleware'

import { CoursesService } from './courses.service'
import type { CourseListQuery, UpdateProgressInput } from './courses.types'

interface CoursesController {
  listCourses: RequestHandler
  getCourseBySlug: RequestHandler
  getLessonProgress: RequestHandler
  updateLessonProgress: RequestHandler
  getUserEnrollments: RequestHandler
}

function getAuthenticatedUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError()
  }
  return req.user.id
}

export function createCoursesController(
  service: CoursesService = new CoursesService(),
): CoursesController {
  return {
    listCourses: asyncHandler(async (req: Request, res: Response) => {
      const query = req.query as unknown as CourseListQuery
      const result = await service.getCourses(query)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    getCourseBySlug: asyncHandler(async (req: Request, res: Response) => {
      const { slug } = req.params
      const course = await service.getCourseBySlug(slug)

      res.status(200).json({
        success: true,
        data: course,
      })
    }),

    getLessonProgress: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const { courseId, lessonId } = req.params
      const progress = await service.getLessonProgress(userId, courseId, lessonId)

      res.status(200).json({
        success: true,
        data: progress,
      })
    }),

    updateLessonProgress: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const { courseId, lessonId } = req.params
      const data = req.body as UpdateProgressInput
      const progress = await service.updateLessonProgress(
        userId,
        courseId,
        lessonId,
        data,
      )

      res.status(200).json({
        success: true,
        data: progress,
      })
    }),

    getUserEnrollments: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const enrollments = await service.getUserEnrollments(userId)

      res.status(200).json({
        success: true,
        data: enrollments,
      })
    }),
  }
}
