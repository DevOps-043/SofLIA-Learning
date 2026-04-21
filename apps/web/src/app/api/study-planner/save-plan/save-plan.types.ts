import type {
  StudyPlanConfig,
  StudySession,
} from '../../../../features/study-planner/types/user-context.types'
import type { SessionMetricsPayload } from '../dashboard/chat/calendar.service'

export interface SavePlanRequest {
  config: StudyPlanConfig
  sessions: StudySession[]
}

export interface SavePlanResponse {
  success: boolean
  error?: string
  data?: {
    planId: string
    sessionsCreated: number
    sessionIds: string[]
    sessions: Array<{
      id: string
      clientReferenceId?: string
      startTime: string
      endTime: string
    }>
  }
}

export interface InvalidSavePlanSession {
  index: number
  reason: string
}

export interface CreatedStudySessionRow {
  id: string
  start_time: string
  end_time: string
  metrics: SessionMetricsPayload | null
}

export interface SavePlanSessionInsertRow {
  organization_id: string | null
  plan_id: string
  user_id: string
  title: string
  description: string | null
  course_id: string | null
  lesson_id: string | null
  start_time: string
  end_time: string
  status: 'planned'
  is_ai_generated: boolean
  session_type: string
  metrics: SessionMetricsPayload
}
