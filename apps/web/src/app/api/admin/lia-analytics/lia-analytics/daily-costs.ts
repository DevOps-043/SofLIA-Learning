import { applyProviderFilter } from './provider-filter'
import type {
  DailyCostRow,
  LiaAnalyticsSupabaseClient,
} from './types'

const pageLimit = 1000

export async function getCostsByPeriod(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; provider: string; startDate: Date }
) {
  const startDateUTC = new Date(input.startDate)
  startDateUTC.setUTCHours(0, 0, 0, 0)
  const dailyCosts = await fetchDailyCosts(supabase, {
    nowISO: input.nowISO,
    provider: input.provider,
    startDateUTC,
  })
  const costsByDay = groupCostsByDay(dailyCosts)

  return fillCostsByPeriod(startDateUTC, costsByDay)
}

async function fetchDailyCosts(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; provider: string; startDateUTC: Date }
): Promise<DailyCostRow[]> {
  const rows: DailyCostRow[] = []
  let hasMore = true
  let offset = 0

  while (hasMore) {
    let query = supabase
      .from('lia_messages')
      .select('created_at, cost_usd, tokens_used, model_used')
      .gte('created_at', input.startDateUTC.toISOString())
      .lte('created_at', input.nowISO)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageLimit - 1)

    query = applyProviderFilter(query, input.provider)
    const { data, error } = await query

    if (error) {
      console.error('[LIA Analytics] Error fetching daily costs:', error)
      break
    }

    if (data && data.length > 0) {
      rows.push(...((data || []) as DailyCostRow[]))
      offset += pageLimit
      hasMore = data.length === pageLimit
    } else {
      hasMore = false
    }
  }

  return rows
}

function groupCostsByDay(rows: DailyCostRow[]) {
  const costsByDay = new Map<string, { cost: number; messages: number; tokens: number }>()

  rows.forEach((row) => {
    if (!row.created_at) {
      return
    }

    const date = getUtcDateKey(row.created_at)
    const existing = costsByDay.get(date) || { cost: 0, messages: 0, tokens: 0 }
    costsByDay.set(date, {
      cost: existing.cost + (Number(row.cost_usd) || 0),
      messages: existing.messages + 1,
      tokens: existing.tokens + (Number(row.tokens_used) || 0),
    })
  })

  return costsByDay
}

function fillCostsByPeriod(
  startDateUTC: Date,
  costsByDay: Map<string, { cost: number; messages: number; tokens: number }>
) {
  const todayUTC = new Date()
  todayUTC.setUTCHours(23, 59, 59, 999)
  const tempDate = new Date(startDateUTC)
  const costsByPeriod = []
  let dayCount = 0

  while (tempDate <= todayUTC && dayCount < 365) {
    const date = getUtcDateKey(tempDate.toISOString())
    const dayData = costsByDay.get(date) || { cost: 0, messages: 0, tokens: 0 }
    costsByPeriod.push({
      cost: Number(dayData.cost.toFixed(6)),
      date,
      messages: dayData.messages,
      tokens: dayData.tokens,
    })
    tempDate.setUTCDate(tempDate.getUTCDate() + 1)
    dayCount += 1
  }

  return costsByPeriod
}

function getUtcDateKey(value: string): string {
  if (value.includes(' ')) {
    return value.split(' ')[0]
  }

  return value.split('T')[0]
}
