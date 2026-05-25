export type ActionType =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_sessions'
  | 'get_plan_summary'
  | 'list_calendar_events'
  | 'create_calendar_event'
  | 'move_calendar_event'
  | 'delete_calendar_event'
  | 'rebalance_plan'
  | 'create_micro_session'
  | 'reduce_session_load'
  | 'recover_missed_session'
  | 'resync_calendar_sessions'
  | 'update_calendar_selection'
  | 'delete_plan'
  | 'rebalance'
  | 'rebalanzar'
  | 'redistribuir'
  | 'none'

export interface ActionResult {
  type: ActionType
  data?: unknown
  status: 'success' | 'error' | 'pending' | 'confirmation_needed'
  code?: string
  requiresConfirmation?: boolean
  traceId?: string
  message?: string
}

export interface ActionProposal extends ActionResult {
  status: 'confirmation_needed' | 'error' | 'pending'
  requiresConfirmation: boolean
}

export interface SyncResult {
  deletedFromDb: string[]
  orphanedSessionIds?: string[]
  orphanedSessions: string[]
  message: string
}
