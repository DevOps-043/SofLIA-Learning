export interface PendingInactivityCloseSession {
  session_id: string
  state: string
  updated_at: string
  active_seconds_updated_at: string | null
}

export interface DialogueTurnTimestamp {
  created_at: string
}
