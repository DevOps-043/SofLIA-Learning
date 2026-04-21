import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin'
import type { SessionRow } from './dashboard-action.types'

export function createDashboardActionAdminClient() {
  return createSharedAdminClient()
}

export type DashboardActionSupabaseClient = ReturnType<
  typeof createDashboardActionAdminClient
>

export async function ensureAuthorizedPlan(params: {
  planId: string
  supabase: DashboardActionSupabaseClient
  userId: string
}) {
  const { data: plan, error } = await params.supabase
    .from('study_plans')
    .select('id')
    .eq('id', params.planId)
    .eq('user_id', params.userId)
    .single()

  return {
    plan,
    error,
  }
}

export async function findPlannedSessionConflicts(params: {
  endTime: string
  excludeSessionId?: string
  planId: string
  startTime: string
  supabase: DashboardActionSupabaseClient
}) {
  let query = params.supabase
    .from('study_sessions')
    .select('id, title, start_time, end_time')
    .eq('plan_id', params.planId)
    .eq('status', 'planned')

  if (params.excludeSessionId) {
    query = query.neq('id', params.excludeSessionId)
  }

  const { data } = await query
  const newStart = new Date(params.startTime)
  const newEnd = new Date(params.endTime)

  return (data || []).filter((session: SessionRow) => {
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)
    return newStart < end && newEnd > start
  })
}
