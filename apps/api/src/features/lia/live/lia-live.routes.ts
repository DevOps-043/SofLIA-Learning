import { Router } from 'express'

import {
  getGeminiLiveModel,
  isLiaLiveConfigured,
} from './lia-live.config'

export function createLiaLiveRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        enabled: isLiaLiveConfigured(),
        model: getGeminiLiveModel(),
      },
    })
  })

  return router
}
