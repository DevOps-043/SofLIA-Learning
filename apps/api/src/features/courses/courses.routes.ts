import { Router } from 'express'

import { authenticate } from '@/core/middleware/auth.middleware'
import { validateRequest } from '@/core/validation/validate.middleware'

import { createCoursesController } from './courses.controller'
import {
  courseListQuerySchema,
  courseSlugParamsSchema,
  lessonIdParamsSchema,
  updateProgressBodySchema,
} from './courses.types'

export function createCoursesRouter() {
  const router = Router()
  const controller = createCoursesController()

  // Public routes — no auth required for course catalog
  router.get(
    '/',
    validateRequest({ query: courseListQuerySchema }),
    controller.listCourses,
  )

  router.get(
    '/:slug',
    validateRequest({ params: courseSlugParamsSchema }),
    controller.getCourseBySlug,
  )

  // Protected routes — require authentication
  router.get('/enrollments/me', authenticate, controller.getUserEnrollments)

  router.get(
    '/:courseId/lessons/:lessonId/progress',
    authenticate,
    validateRequest({ params: lessonIdParamsSchema }),
    controller.getLessonProgress,
  )

  router.patch(
    '/:courseId/lessons/:lessonId/progress',
    authenticate,
    validateRequest({
      params: lessonIdParamsSchema,
      body: updateProgressBodySchema,
    }),
    controller.updateLessonProgress,
  )

  return router
}
