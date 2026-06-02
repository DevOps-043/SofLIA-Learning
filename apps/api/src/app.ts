import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from '@/config/env'
import { logger } from '@/core/logging/logger'
import {
  errorHandler,
  notFoundHandler,
} from '@/core/middleware/error.middleware'
import { apiRateLimiter } from '@/core/middleware/rate-limit.middleware'
import { createAdminUsersRouter } from '@/features/admin/users/admin-users.routes'
import { createBusinessAnalyticsRouter } from '@/features/business/analytics/analytics.routes'
import { createCoursesRouter } from '@/features/courses/courses.routes'
import { createLiaLiveRouter } from '@/features/lia/live/lia-live.routes'
import { createNotificationsRouter } from '@/features/notifications/notifications.routes'
import { createProfileRouter } from '@/features/profile/profile.routes'
import { createStudyPlannerRouter } from '@/features/study-planner/study-planner.routes'
import {
  secureCorsMiddleware,
  validateCORSConfiguration,
} from '@/middleware/secure-cors'

export function createApp() {
  const app = express()
  const apiVersion = config.API_VERSION || 'v1'
  const startTime = Date.now()

  validateCORSConfiguration()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(compression())
  app.use(apiRateLimiter)
  app.use(secureCorsMiddleware)
  app.use(
    morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev', {
      skip: (req) => !req.path.startsWith('/api') && req.path !== '/health',
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'API Chat-Bot-LIA is running',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    })
  })

  app.get(`/api/${apiVersion}/version`, (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        version: process.env.npm_package_version || '1.0.0',
        apiVersion,
        environment: config.NODE_ENV,
      },
    })
  })

  app.get(`/api/${apiVersion}/metrics`, (_req, res) => {
    const memoryUsage = process.memoryUsage()

    res.status(200).json({
      success: true,
      data: {
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        memory: {
          rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
          heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        node_version: process.version,
        timestamp: new Date().toISOString(),
      },
    })
  })

  app.use(`/api/${apiVersion}/notifications`, createNotificationsRouter())
  app.use(`/api/${apiVersion}/admin/users`, createAdminUsersRouter())
  app.use(`/api/${apiVersion}/business`, createBusinessAnalyticsRouter())
  app.use(`/api/${apiVersion}/courses`, createCoursesRouter())
  app.use(`/api/${apiVersion}/lia/live`, createLiaLiveRouter())
  app.use(`/api/${apiVersion}/profile`, createProfileRouter())
  app.use(`/api/${apiVersion}/study-planner`, createStudyPlannerRouter())

  app.use(notFoundHandler)
  app.use(errorHandler)

  logger.info('Express API configurada', {
    apiVersion,
    environment: config.NODE_ENV,
  })

  return app
}
