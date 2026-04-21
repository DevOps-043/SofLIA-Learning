import type { Database } from '../../../../../lib/supabase/types'

export type ActionType =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'complete_session'
  | 'reschedule_sessions'

export type StudySessionUpdateFields = Pick<
  Database['public']['Tables']['study_sessions']['Update'],
  'title' | 'description' | 'notes'
>

export interface MoveSessionData {
  sessionId: string
  newStartTime: string
  newEndTime: string
}

export interface DeleteSessionData {
  sessionId: string
}

export interface ResizeSessionData {
  sessionId: string
  newDurationMinutes: number
}

export interface CreateSessionData {
  title: string
  startTime: string
  endTime: string
  courseId?: string | null
  lessonId?: string | null
  description?: string | null
}

export type UpdateSessionData = {
  sessionId: string
} & StudySessionUpdateFields

export interface CompleteSessionData {
  sessionId: string
  selfEvaluation?: Database['public']['Tables']['study_sessions']['Update']['self_evaluation']
  notes?: Database['public']['Tables']['study_sessions']['Update']['notes']
}

export interface RescheduleSessionItem {
  sessionId: string
  newStartTime: string
  newEndTime: string
}

export interface RescheduleSessionsData {
  sessionIds: string[]
  newSchedule: RescheduleSessionItem[]
}

export type ActionPayloadMap = {
  move_session: MoveSessionData
  delete_session: DeleteSessionData
  resize_session: ResizeSessionData
  create_session: CreateSessionData
  update_session: UpdateSessionData
  complete_session: CompleteSessionData
  reschedule_sessions: RescheduleSessionsData
}

export type ActionRequest<T extends ActionType = ActionType> = {
  action: T
  planId: string
  data: ActionPayloadMap[T]
}

export interface ActionResponse {
  success: boolean
  message?: string
  data?: Record<string, unknown>
  error?: string
}

export interface SessionRow {
  id: string
  title: string
  start_time: string
  end_time: string
}
