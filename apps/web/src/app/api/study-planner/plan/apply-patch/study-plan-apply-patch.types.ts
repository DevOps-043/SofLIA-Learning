export interface StudyPlanPatchSessionTarget {
  sessionId?: string
  clientReferenceId?: string
}

export interface MoveSessionPatchOperation
  extends StudyPlanPatchSessionTarget {
  type: 'move_session'
  targetDate: string
  targetStartTime: string
  targetEndTime: string
}

export interface ResizeSessionPatchOperation
  extends StudyPlanPatchSessionTarget {
  type: 'resize_session'
  dateStr?: string
  targetStartTime: string
  targetEndTime: string
}

export interface MoveDayPatchOperation {
  type: 'move_day'
  sourceDate: string
  targetDate: string
  sessionIds?: string[]
  clientReferenceIds?: string[]
}

export type StudyPlanPatchOperation =
  | MoveSessionPatchOperation
  | ResizeSessionPatchOperation
  | MoveDayPatchOperation

export interface StudyPlanApplyPatchRequest {
  planId: string
  operations: StudyPlanPatchOperation[]
}
