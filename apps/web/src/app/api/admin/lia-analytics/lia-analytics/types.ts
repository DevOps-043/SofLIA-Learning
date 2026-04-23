import { createClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface MessageMetricsRow {
  tokens_used: number | null
  cost_usd: number | null
  response_time_ms: number | null
  model_used: string | null
  role: string | null
}

export interface DailyCostRow {
  created_at: string
  cost_usd: number | null
  tokens_used: number | null
  model_used: string | null
}
