import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { UserSessionRecord } from './user-session-record'

export async function fetchUserSessions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('user_session')
    .select('id, issued_at')
    .eq('user_id', userId)
    .gte('issued_at', period.from)
    .lte('issued_at', period.to)
    .limit(PAGE_LIMIT)
    .returns<UserSessionRecord[]>()

  logQueryError('business user sessions', error)
  return data || []
}
