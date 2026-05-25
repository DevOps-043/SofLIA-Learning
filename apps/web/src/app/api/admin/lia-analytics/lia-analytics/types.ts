import type { createClient } from '@/lib/supabase/server'

export type LiaAnalyticsSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface AnalyticsRequestParams {
  customEndDate?: string | null
  customStartDate?: string | null
  period: string
  provider: string
}

export interface AnalyticsDateRange {
  endDate: Date
  startDate: Date
}

export interface LiaMessageMetricRow {
  cost_usd: number | null
  model_used: string | null
  response_time_ms: number | null
  role: string | null
  tokens_used: number | null
}

export interface DailyCostRow {
  cost_usd: number | null
  created_at: string
  model_used: string | null
  tokens_used: number | null
}
