import type { LiaAnalyticsSupabaseClient } from './types'

export async function getContextDistribution(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; startDate: Date }
) {
  const { data } = await supabase
    .from('lia_conversation_analytics')
    .select('context_type, total_cost_usd, total_tokens')
    .gte('started_at', input.startDate.toISOString())
    .lte('started_at', input.nowISO)

  const contextCounts = new Map<
    string,
    { cost: number; count: number; tokens: number }
  >()

  data?.forEach((row) => {
    const type = row.context_type || 'general'
    const existing = contextCounts.get(type) || { cost: 0, count: 0, tokens: 0 }
    contextCounts.set(type, {
      cost: existing.cost + (row.total_cost_usd || 0),
      count: existing.count + 1,
      tokens: existing.tokens + (row.total_tokens || 0),
    })
  })

  const totalContextCount = Array.from(contextCounts.values()).reduce(
    (sum, item) => sum + item.count,
    0
  )

  return Array.from(contextCounts.entries()).map(([contextType, item]) => ({
    contextType,
    cost: Number(item.cost.toFixed(6)),
    count: item.count,
    percentage:
      totalContextCount > 0
        ? Number(((item.count / totalContextCount) * 100).toFixed(1))
        : 0,
    tokens: item.tokens,
  }))
}
