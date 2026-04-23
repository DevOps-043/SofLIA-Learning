import type { SupabaseServerClient } from './types'

export async function getContextDistribution(
  supabase: SupabaseServerClient,
  startIso: string,
  endIso: string,
) {
  const { data } = await supabase
    .from('lia_conversation_analytics')
    .select('context_type, total_cost_usd, total_tokens')
    .gte('started_at', startIso)
    .lte('started_at', endIso)

  const counts = new Map<string, { count: number; cost: number; tokens: number }>()
  ;(data ?? []).forEach((row) => {
    const contextType = row.context_type || 'general'
    const current = counts.get(contextType) ?? { count: 0, cost: 0, tokens: 0 }
    counts.set(contextType, {
      count: current.count + 1,
      cost: current.cost + (row.total_cost_usd || 0),
      tokens: current.tokens + (row.total_tokens || 0),
    })
  })

  const totalCount = Array.from(counts.values()).reduce((sum, row) => sum + row.count, 0)
  return Array.from(counts.entries()).map(([contextType, row]) => ({
    contextType,
    count: row.count,
    cost: Number(row.cost.toFixed(6)),
    tokens: row.tokens,
    percentage: totalCount > 0 ? Number(((row.count / totalCount) * 100).toFixed(1)) : 0,
  }))
}
