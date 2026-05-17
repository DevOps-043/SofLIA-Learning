import { z } from 'zod'

import {
  nonEmptyStringSchema,
  paginationQuerySchema,
  sortDirectionSchema,
} from '@/core/validation/common.schemas'

export const sessionStatusSchema = z.enum([
  'planned',
  'completed',
  'cancelled',
  'in_progress',
  'missed',
  'rescheduled',
])

export const studySessionListQuerySchema = paginationQuerySchema.extend({
  planId: nonEmptyStringSchema.optional(),
  status: sessionStatusSchema.optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  orderBy: z.enum(['start_time', 'created_at']).default('start_time'),
  orderDirection: sortDirectionSchema.default('asc'),
})

export const sessionIdParamsSchema = z.object({
  sessionId: nonEmptyStringSchema,
})

export const planIdParamsSchema = z.object({
  planId: nonEmptyStringSchema,
})

export const createSessionBodySchema = z.object({
  planId: nonEmptyStringSchema,
  courseId: nonEmptyStringSchema.optional(),
  title: nonEmptyStringSchema.max(200),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  notes: z.string().max(2000).optional(),
})

export const updateSessionBodySchema = z.object({
  title: z.string().max(200).optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime: z.string().datetime({ offset: true }).optional(),
  status: sessionStatusSchema.optional(),
  notes: z.string().max(2000).optional(),
})

export const createPlanBodySchema = z.object({
  title: nonEmptyStringSchema.max(200),
  courseId: nonEmptyStringSchema.optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  dailyStudyMinutes: z.number().int().min(15).max(480).optional(),
})
