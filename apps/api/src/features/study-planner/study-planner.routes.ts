import { Router } from 'express'

import { authenticate } from '@/core/middleware/auth.middleware'
import { validateRequest } from '@/core/validation/validate.middleware'

import { createStudyPlannerController } from './study-planner.controller'
import {
  createPlanBodySchema,
  createSessionBodySchema,
  planIdParamsSchema,
  sessionIdParamsSchema,
  studySessionListQuerySchema,
  updateSessionBodySchema,
} from './study-planner.types'

export function createStudyPlannerRouter() {
  const router = Router()
  const controller = createStudyPlannerController()

  router.use(authenticate)

  // Sessions
  router.get(
    '/sessions',
    validateRequest({ query: studySessionListQuerySchema }),
    controller.listSessions,
  )

  router.get(
    '/sessions/:sessionId',
    validateRequest({ params: sessionIdParamsSchema }),
    controller.getSessionById,
  )

  router.post(
    '/sessions',
    validateRequest({ body: createSessionBodySchema }),
    controller.createSession,
  )

  router.patch(
    '/sessions/:sessionId',
    validateRequest({ params: sessionIdParamsSchema, body: updateSessionBodySchema }),
    controller.updateSession,
  )

  router.delete(
    '/sessions/:sessionId',
    validateRequest({ params: sessionIdParamsSchema }),
    controller.deleteSession,
  )

  // Plans
  router.get('/plans', controller.listPlans)

  router.get(
    '/plans/:planId',
    validateRequest({ params: planIdParamsSchema }),
    controller.getPlanById,
  )

  router.post(
    '/plans',
    validateRequest({ body: createPlanBodySchema }),
    controller.createPlan,
  )

  return router
}
