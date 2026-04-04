import type { Request, RequestHandler, Response } from 'express'

import { UnauthorizedError, ValidationError } from '@/core/errors/app-error'
import { asyncHandler } from '@/core/middleware/error.middleware'

import { ProfileService } from './profile.service'
import { updateProfileBodySchema } from './profile.types'

function getAuthenticatedUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError()
  return req.user.id
}

interface ProfileController {
  getProfile: RequestHandler
  updateProfile: RequestHandler
  updateProfilePicture: RequestHandler
}

export function createProfileController(
  service: ProfileService = new ProfileService(),
): ProfileController {
  return {
    getProfile: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const profile = await service.getProfile(userId)

      res.status(200).json({ success: true, data: profile })
    }),

    updateProfile: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const parsed = updateProfileBodySchema.safeParse(req.body)
      if (!parsed.success) {
        throw new ValidationError('Datos de perfil inválidos', parsed.error.flatten().fieldErrors)
      }

      const profile = await service.updateProfile(userId, parsed.data)
      res.status(200).json({ success: true, data: profile })
    }),

    updateProfilePicture: asyncHandler(async (req: Request, res: Response) => {
      const userId = getAuthenticatedUserId(req)
      const { pictureUrl } = req.body as { pictureUrl?: string }

      if (!pictureUrl || typeof pictureUrl !== 'string') {
        throw new ValidationError('Se requiere pictureUrl')
      }

      const profile = await service.updateProfilePicture(userId, pictureUrl)
      res.status(200).json({ success: true, data: profile })
    }),
  }
}
