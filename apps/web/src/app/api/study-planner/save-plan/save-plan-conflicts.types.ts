import type { createAdminClient } from './save-plan-organization.service'

export type SavePlanSupabaseClient = ReturnType<typeof createAdminClient>

export interface ExistingStudySessionRow {
  id: string
  plan_id: string | null
  title: string | null
  start_time: string
  end_time: string
  status: string | null
}

export interface SavePlanSessionConflict {
  candidateTitle: string
  conflictingTitle: string
  startTime: string
  endTime: string
}
