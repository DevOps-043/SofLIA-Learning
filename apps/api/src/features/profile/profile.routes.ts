import { Router } from 'express'

import { authenticate } from '@/core/middleware/auth.middleware'

import { createProfileController } from './profile.controller'

export function createProfileRouter(): Router {
  const router = Router()
  const controller = createProfileController()

  router.get('/', authenticate, controller.getProfile)
  router.patch('/', authenticate, controller.updateProfile)
  router.post('/picture', authenticate, controller.updateProfilePicture)

  return router
}
