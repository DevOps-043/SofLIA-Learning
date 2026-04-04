import type { Request, RequestHandler, Response } from 'express'

import { UnauthorizedError } from '@/core/errors/app-error'
import { asyncHandler } from '@/core/middleware/error.middleware'

import { StudyPlannerService } from './study-planner.service'
import type {
  CreatePlanInput,
  CreateSessionInput,
  StudySessionListQuery,
  UpdateSessionInput,
} from './study-planner.types'

interface StudyPlannerController {
  listSessions: RequestHandler
  getSessionById: RequestHandler
  createSession: RequestHandler
  updateSession: RequestHandler
  deleteSession: RequestHandler
  listPlans: RequestHandler
  getPlanById: RequestHandler
  createPlan: RequestHandler
}

function getAuthenticatedUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError()
  }
  return req.user.id
}

export function createStudyPlannerController(
  service: StudyPlannerService = new StudyPlannerService(),
): StudyPlannerController {
  return {
    listSessions: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const query = req.query as unknown as StudySessionListQuery
      const result = await service.getSessions(userId, query)

      res.status(200).json({ success: true, data: result })
    }),

    getSessionById: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const session = await service.getSessionById(req.params.sessionId, userId)

      res.status(200).json({ success: true, data: session })
    }),

    createSession: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const data = req.body as CreateSessionInput
      const session = await service.createSession(userId, data)

      res.status(201).json({ success: true, data: session })
    }),

    updateSession: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const data = req.body as UpdateSessionInput
      const session = await service.updateSession(req.params.sessionId, userId, data)

      res.status(200).json({ success: true, data: session })
    }),

    deleteSession: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      await service.deleteSession(req.params.sessionId, userId)
      res.status(204).send()
    }),

    listPlans: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const plans = await service.getPlans(userId)

      res.status(200).json({ success: true, data: plans })
    }),

    getPlanById: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const plan = await service.getPlanById(req.params.planId, userId)

      res.status(200).json({ success: true, data: plan })
    }),

    createPlan: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const data = req.body as CreatePlanInput
      const plan = await service.createPlan(userId, data)

      res.status(201).json({ success: true, data: plan })
    }),
  }
}
