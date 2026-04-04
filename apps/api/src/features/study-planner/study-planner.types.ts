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

export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type StudySessionListQuery = z.infer<typeof studySessionListQuerySchema>
export type CreateSessionInput = z.infer<typeof createSessionBodySchema>
export type UpdateSessionInput = z.infer<typeof updateSessionBodySchema>
export type CreatePlanInput = z.infer<typeof createPlanBodySchema>

export interface StudySession {
  id: string
  user_id: string
  plan_id: string | null
  course_id: string | null
  title: string
  start_time: string
  end_time: string
  status: SessionStatus
  notes: string | null
  external_event_id: string | null
  calendar_provider: string | null
  created_at: string
  updated_at: string
}

export interface StudyPlan {
  id: string
  user_id: string
  course_id: string | null
  title: string
  start_date: string
  end_date: string
  daily_study_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudySessionListResult {
  sessions: StudySession[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface NormalizedSessionListQuery {
  planId?: string
  status?: SessionStatus
  startDate?: string
  endDate?: string
  orderBy: 'start_time' | 'created_at'
  orderDirection: 'asc' | 'desc'
  limit: number
  offset: number
  page: number
}
