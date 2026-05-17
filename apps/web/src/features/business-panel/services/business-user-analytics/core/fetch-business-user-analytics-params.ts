import type { BusinessUserAnalyticsRange } from '../../../types/business-user-analytics.types'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'

export interface FetchBusinessUserAnalyticsParams {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
}
