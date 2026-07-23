import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_STATS_MONTH_NAMES } from './constants'
import { statsTable } from './stats-query.client'
import type { MonthlyGrowthData } from './types'

interface CreatedAtRow {
  created_at: string
}

type GrowthMetricKey = 'users' | 'courses'

export async function getMonthlyGrowth(
  period: number = 8,
): Promise<MonthlyGrowthData[]> {
  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - period)

    // Solo métricas B2B reales. Las series de features consumer (communities,
    // ai_prompts, ai_apps) se retiraron con sus tablas; consultarlas daba 404.
    const [users, courses] = await Promise.all([
      statsTable<CreatedAtRow>(supabase, 'users').select('created_at').gte('created_at', startDate.toISOString()),
      statsTable<CreatedAtRow>(supabase, 'courses').select('created_at').gte('created_at', startDate.toISOString()).eq('is_active', true),
    ])

    const monthMap = buildEmptyMonthMap(period)
    incrementMonthlyMetric(monthMap, users.data, 'users')
    incrementMonthlyMetric(monthMap, courses.data, 'courses')

    return Array.from(monthMap.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber,
    )
  } catch (error) {
    techDebtLogger.error('Error getting monthly growth:', error)
    return []
  }
}

function buildEmptyMonthMap(period: number): Map<string, MonthlyGrowthData> {
  const monthMap = new Map<string, MonthlyGrowthData>()

  for (let i = 0; i < period; i += 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - (period - 1 - i))
    const monthKey = getMonthKey(date)

    monthMap.set(monthKey, {
      month: ADMIN_STATS_MONTH_NAMES[date.getMonth()],
      monthNumber: date.getMonth() + 1,
      year: date.getFullYear(),
      users: 0,
      courses: 0,
    })
  }

  return monthMap
}

function incrementMonthlyMetric(
  monthMap: Map<string, MonthlyGrowthData>,
  rows: CreatedAtRow[] | null,
  metric: GrowthMetricKey,
): void {
  rows?.forEach((row) => {
    const data = monthMap.get(getMonthKey(new Date(row.created_at)))
    if (data) data[metric] += 1
  })
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
