import cors from 'cors'

import {
  CORS_ALLOWED_HEADERS,
  CORS_EXPOSED_HEADERS,
  CORS_METHODS,
  CORS_OPTIONS_SUCCESS_STATUS,
  CORS_PREFLIGHT_MAX_AGE_SECONDS,
} from './secure-cors.constants'
import {
  getAllowedOrigins,
  validateCORSConfiguration,
  validateRequestOrigin,
} from './secure-cors.origins'
import { config } from '../config/env'

export const secureCorsMiddleware = cors({
  origin: (origin, callback) => {
    try {
      callback(null, validateRequestOrigin(origin))
    } catch (error) {
      callback(error as Error, false)
    }
  },
  credentials: true,
  methods: CORS_METHODS,
  allowedHeaders: CORS_ALLOWED_HEADERS,
  exposedHeaders: CORS_EXPOSED_HEADERS,
  maxAge: CORS_PREFLIGHT_MAX_AGE_SECONDS,
  optionsSuccessStatus: CORS_OPTIONS_SUCCESS_STATUS,
})

export { validateCORSConfiguration }

export function getCORSInfo() {
  return {
    environment: config.NODE_ENV,
    allowedOrigins: getAllowedOrigins(),
    credentialsAllowed: true,
    methods: CORS_METHODS,
  }
}
