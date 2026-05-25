import type { z } from 'zod'

import {
  createPlanBodySchema,
  createSessionBodySchema,
  sessionStatusSchema,
  studySessionListQuerySchema,
  updateSessionBodySchema,
} from './study-planner.schemas'

export {
  createPlanBodySchema,
  createSessionBodySchema,
  planIdParamsSchema,
  sessionIdParamsSchema,
  sessionStatusSchema,
  studySessionListQuerySchema,
  updateSessionBodySchema,
} from './study-planner.schemas'

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
