import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

const ErrorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.string(),
    details: z.unknown().optional(),
  }),
)

const HealthDependencySchema = registry.register(
  'HealthDependency',
  z.object({
    status: z.enum(['ok', 'degraded', 'down']),
    responseTimeMs: z.number().nonnegative(),
    message: z.string().optional(),
  }),
)

const HealthResponseSchema = registry.register(
  'HealthResponse',
  z.object({
    status: z.enum(['ok', 'degraded', 'down']),
    checkedAt: z.string().datetime(),
    correlationId: z.string(),
    checks: z.object({
      database: HealthDependencySchema,
      gemini: HealthDependencySchema,
      observability: HealthDependencySchema,
    }),
  }),
)

const ProfileUpdateRequestSchema = registry.register(
  'ProfileUpdateRequest',
  z.object({
    username: z.string().min(3).max(30).optional(),
    first_name: z.string().max(100).nullable().optional(),
    last_name: z.string().max(100).nullable().optional(),
    display_name: z.string().max(100).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    location: z.string().max(100).nullable().optional(),
    cargo_rol: z.string().nullable().optional(),
    type_rol: z.string().nullable().optional(),
    job_title: z.string().max(100).nullable().optional(),
    job_description: z.string().max(1000).nullable().optional(),
    profile_picture_url: z.string().url().max(500).or(z.literal('')).nullable().optional(),
    country_code: z.string().max(10).nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
  }).strict(),
)

const ProfileResponseSchema = registry.register(
  'ProfileResponse',
  z.object({
    id: z.string().uuid().optional(),
    email: z.string().email().nullable().optional(),
    username: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    profile_picture_url: z.string().nullable().optional(),
  }).passthrough(),
)

const StudyPlannerSessionSchema = registry.register(
  'StudyPlannerSession',
  z.object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    status: z.string().nullable(),
    course_id: z.string().uuid().nullable(),
    lesson_id: z.string().uuid().nullable(),
    is_ai_generated: z.boolean().nullable(),
    session_type: z.string().nullable(),
    external_event_id: z.string().nullable(),
    calendar_provider: z.string().nullable(),
    metrics: z.unknown().nullable(),
    plan_id: z.string().uuid().nullable(),
  }),
)

const StudyPlannerSessionsResponseSchema = registry.register(
  'StudyPlannerSessionsResponse',
  z.object({
    sessions: z.array(StudyPlannerSessionSchema),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalSessions: z.number().int().nonnegative(),
    hasActivePlan: z.boolean(),
  }),
)

const PerformanceMetricsResponseSchema = registry.register(
  'PerformanceMetricsResponse',
  z.object({
    timestamp: z.string().datetime(),
    environment: z.string().optional(),
    serverClientPool: z.object({}).passthrough(),
    browserClientPool: z.object({}).passthrough(),
    requestDeduplication: z.object({}).passthrough(),
    memoryCache: z.object({}).passthrough(),
    capacityBudget: z.object({}).passthrough(),
    summary: z.object({}).passthrough(),
  }),
)

function jsonResponse(schema: z.ZodTypeAny, description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema,
      },
    },
  }
}

const unauthorizedResponse = jsonResponse(ErrorResponseSchema, 'Authentication is required.')
const validationErrorResponse = jsonResponse(ErrorResponseSchema, 'The request payload is invalid.')
const internalErrorResponse = jsonResponse(ErrorResponseSchema, 'Unexpected server error.')

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Operations'],
  summary: 'Read application dependency health.',
  responses: {
    200: jsonResponse(HealthResponseSchema, 'Application is healthy or degraded.'),
    503: jsonResponse(HealthResponseSchema, 'A critical dependency is down.'),
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/profile',
  tags: ['Profile'],
  summary: 'Read the authenticated user profile.',
  security: [{ SupabaseAuth: [] }],
  request: {
    query: z.object({
      org: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: jsonResponse(ProfileResponseSchema, 'Authenticated user profile.'),
    401: unauthorizedResponse,
    500: internalErrorResponse,
  },
})

registry.registerPath({
  method: 'put',
  path: '/api/profile',
  tags: ['Profile'],
  summary: 'Update the authenticated user profile.',
  security: [{ SupabaseAuth: [] }],
  request: {
    query: z.object({
      org: z.string().uuid().optional(),
    }),
    body: {
      content: {
        'application/json': {
          schema: ProfileUpdateRequestSchema,
        },
      },
    },
  },
  responses: {
    200: jsonResponse(ProfileResponseSchema, 'Updated profile.'),
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/study-planner/sessions',
  tags: ['Study Planner'],
  summary: 'List study sessions for the authenticated user.',
  security: [{ SupabaseAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      planId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: jsonResponse(StudyPlannerSessionsResponseSchema, 'Study sessions for the date range.'),
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/performance/metrics',
  tags: ['Operations'],
  summary: 'Read runtime performance counters and capacity budgets.',
  responses: {
    200: jsonResponse(PerformanceMetricsResponseSchema, 'Runtime performance metrics.'),
    500: internalErrorResponse,
  },
})

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  const document = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'SofLIA Learning API',
      version: '0.1.0',
      description:
        'Incremental OpenAPI contract generated from Zod schemas. New API routes should register schemas here as they adopt request validation.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local web app',
      },
    ],
    tags: [
      { name: 'Operations', description: 'Operational health and performance endpoints.' },
      { name: 'Profile', description: 'Authenticated user profile operations.' },
      { name: 'Study Planner', description: 'Study planning and calendar workflows.' },
    ],
  })

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        SupabaseAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description: 'Supabase-managed authenticated session cookie.',
        },
      },
    },
  }
}
