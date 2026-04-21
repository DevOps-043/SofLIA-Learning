export interface ProactiveSessionInput {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  duration_minutes: number | null
  plan_id: string
  derivedStatus?: 'effectively_completed' | 'completed_early' | 'in_progress' | 'overdue' | null
  progressPct?: number
  hasCalendarEventLinked?: boolean
}
