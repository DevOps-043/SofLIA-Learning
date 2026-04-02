import type { createAdminClient } from '@/lib/supabase/admin'

export interface SessionUpdateInput {
  sessionId?: string
  dateStr: string
  originalStartTime: string
  newStartTime: string
  newEndTime: string
}

export interface UpdateSessionRequest {
  planId: string
  updates: SessionUpdateInput[]
}

export interface StudyPlannerSessionUpdateRecord {
  id: string
  start_time: string
}

export interface StudyPlannerSessionLookup {
  sessionsById: Map<string, StudyPlannerSessionUpdateRecord>
  sessionsByDate: Map<string, StudyPlannerSessionUpdateRecord[]>
}

export interface SessionTimeReference {
  date: Date
  hour: number
  minute: number
}

export interface SessionTimeWindow {
  startDateTime: Date
  endDateTime: Date
}

export type StudyPlannerUpdateAdminClient = ReturnType<typeof createAdminClient>

export type UpdateStudyPlannerSessionsServiceResult =
  | { kind: 'plan_not_found' }
  | { kind: 'no_sessions' }
  | {
      kind: 'updated'
      updatedCount: number
      totalUpdates: number
      errors: string[]
    }
