export const CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']

export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-CSRF-Token',
]

export const CORS_EXPOSED_HEADERS = [
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-CSRF-Token',
]

export const CORS_PREFLIGHT_MAX_AGE_SECONDS = 600
export const CORS_OPTIONS_SUCCESS_STATUS = 204
