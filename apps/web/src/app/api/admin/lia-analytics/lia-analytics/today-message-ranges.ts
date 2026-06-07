import { applyProviderFilter } from './provider-filter'
import type { LiaAnalyticsSupabaseClient, LiaMessageMetricRow } from './types'

export async function fetchMessagesForRange(
  supabase: LiaAnalyticsSupabaseClient,
  provider: string,
  start: Date,
  endISO: string
) {
  let query = supabase
    .from('lia_messages')
    .select('content, cost_usd, tokens_used, model_used, role')
    .gte('created_at', start.toISOString())
    .lte('created_at', endISO)

  query = applyProviderFilter(query, provider)
  const { data } = await query

  return (data || []) as LiaMessageMetricRow[]
}
