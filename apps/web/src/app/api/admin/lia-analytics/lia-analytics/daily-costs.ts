import { getUtcDateKey } from './date-range'
import { applyProviderFilter } from './provider-filter'
import type { DailyCostRow, SupabaseServerClient } from './types'

async function fetchDailyCostRows(
  supabase: SupabaseServerClient,
  startIso: string,
  endIso: string,
  provider: string,
) {
  const results: DailyCostRow[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    let query = supabase
      .from('lia_messages')
      .select('created_at, cost_usd, tokens_used, model_used')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    query = applyProviderFilter(query, provider)
    const { data, error } = await query
    if (error || !data?.length) break
    results.push(...(data as DailyCostRow[]))
    if (data.length < limit) break
    offset += limit
  }

  return results
}

export async function getCostsByPeriod(
  supabase: SupabaseServerClient,
  startDate: Date,
  endIso: string,
  provider: string,
) {
  const startUtc = new Date(startDate)
  startUtc.setUTCHours(0, 0, 0, 0)
  const rows = await fetchDailyCostRows(supabase, startUtc.toISOString(), endIso, provider)
  const costsByDay = new Map<string, { cost: number; tokens: number; messages: number }>()

  rows.forEach((row) => {
    const dayKey = getUtcDateKey(row.created_at)
    const current = costsByDay.get(dayKey) ?? { cost: 0, tokens: 0, messages: 0 }
    current.cost += Number(row.cost_usd) || 0
    current.tokens += Number(row.tokens_used) || 0
    current.messages += 1
    costsByDay.set(dayKey, current)
  })

  const series: Array<{ date: string; cost: number; tokens: number; messages: number }> = []
  const todayUtc = new Date()
  todayUtc.setUTCHours(23, 59, 59, 999)
  const cursor = new Date(startUtc)

  for (let dayCount = 0; cursor <= todayUtc && dayCount < 365; dayCount += 1) {
    const dayKey = getUtcDateKey(cursor)
    const current = costsByDay.get(dayKey) ?? { cost: 0, tokens: 0, messages: 0 }
    series.push({
      date: dayKey,
      cost: Number(current.cost.toFixed(6)),
      tokens: current.tokens,
      messages: current.messages,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return series
}
