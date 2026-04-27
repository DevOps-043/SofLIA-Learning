// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Autenticación
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_FINGERPRINT: 'INVALID_FINGERPRINT',
  
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  
  // Autorización
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  
  // Sistema
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Archivos
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Cursos y Progreso
  MODULE_LOCKED: 'MODULE_LOCKED',
  COURSE_NOT_ACCESSIBLE: 'COURSE_NOT_ACCESSIBLE',
  PROGRESS_UPDATE_FAILED: 'PROGRESS_UPDATE_FAILED',
  
  // Comunidad
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  ANSWER_NOT_FOUND: 'ANSWER_NOT_FOUND',
  ALREADY_VOTED: 'ALREADY_VOTED',
  CANNOT_VOTE_OWN_CONTENT: 'CANNOT_VOTE_OWN_CONTENT',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

// Course Status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Module Status
export const MODULE_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Course Difficulty
export const COURSE_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// Reglas de Negocio (según PRD)
export const BUSINESS_RULES = {
  // Autenticación
  JWT_EXPIRY_DAYS: 7,
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  FINGERPRINT_REQUIRED: true,
  
  // Progreso
  VIDEO_COMPLETION_THRESHOLD: 90, // 90% de video visto para marcar como completado
  MODULE_UNLOCK_THRESHOLD: 90, // 90% de módulo anterior completado
  
  // Evaluaciones
  PASSING_SCORE: 70, // 70% mínimo para aprobar
  
  // Archivos
  MAX_FILE_SIZE: 10485760, // 10MB en bytes
  USER_STORAGE_LIMIT: 1073741824, // 1GB en bytes
  
  // Rate Limiting
  API_RATE_LIMIT: 1000, // requests per hour
  
  // Texto
  MAX_QUESTION_TITLE_LENGTH: 200,
  MAX_QUESTION_CONTENT_LENGTH: 5000,
  MAX_ANSWER_CONTENT_LENGTH: 5000,
  MAX_COURSE_TITLE_LENGTH: 150,
  MAX_COURSE_DESCRIPTION_LENGTH: 1000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    AVATAR: '/users/avatar',
    PREFERENCES: '/users/preferences',
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: '/courses/:id',
    MODULES: '/courses/:id/modules',
    PROGRESS: '/courses/:id/progress',
    ENROLL: '/courses/:id/enroll',
    UNENROLL: '/courses/:id/unenroll',
  },
  MODULES: {
    DETAIL: '/modules/:id',
    VIDEOS: '/modules/:id/videos',
    PROGRESS: '/modules/:id/progress',
    UNLOCK: '/modules/:id/unlock',
  },
  VIDEOS: {
    DETAIL: '/videos/:id',
    PROGRESS: '/videos/:id/progress',
    UPDATE_PROGRESS: '/videos/:id/progress',
  },
  COMMUNITY: {
    QUESTIONS: '/community/questions',
    QUESTION_DETAIL: '/community/questions/:id',
    ANSWERS: '/community/questions/:id/answers',
    VOTES: '/community/questions/:id/votes',
    SEARCH: '/community/search',
  },
  EVALUATIONS: {
    LIST: '/evaluations',
    DETAIL: '/evaluations/:id',
    ATTEMPT: '/evaluations/:id/attempt',
    RESULT: '/evaluations/:id/result',
  },
  ADMIN: {
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    ANALYTICS: '/admin/analytics',
    REPORTS: '/admin/reports',
  },
} as const;

// File Types Allowed
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 500, // ms
  TOAST_DURATION: 5000, // ms
  MODAL_ANIMATION_DURATION: 200, // ms
} as const;

