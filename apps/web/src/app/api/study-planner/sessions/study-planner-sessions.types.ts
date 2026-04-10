import type { Database } from '@/lib/supabase/types'

export type StudyPlannerSession = Pick<
  Database['public']['Tables']['study_sessions']['Row'],
  | 'id'
  | 'title'
  | 'description'
  | 'start_time'
  | 'end_time'
  | 'status'
  | 'course_id'
  | 'lesson_id'
  | 'is_ai_generated'
  | 'session_type'
  | 'external_event_id'
  | 'calendar_provider'
  | 'metrics'
  | 'plan_id'
>

export interface StudyPlannerSessionsDateRange {
  startDate: Date
  endDate: Date
}

export interface StudyPlannerSessionsResponse {
  sessions: StudyPlannerSession[]
  startDate: string
  endDate: string
  totalSessions: number
  hasActivePlan: boolean
}

export class StudyPlannerSessionsRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number = 400) {
    super(message)
    this.name = 'StudyPlannerSessionsRequestError'
    this.status = status
  }
}
