import { createClient } from '@/lib/supabase/server'
import { ADMIN_STATS_MONTH_NAMES } from './constants'
import type { MonthlyGrowthData } from './types'

interface CreatedAtRow {
  created_at: string
}

type GrowthMetricKey = 'users' | 'courses' | 'communities' | 'prompts' | 'aiApps'

export async function getMonthlyGrowth(
  period: number = 8,
): Promise<MonthlyGrowthData[]> {
  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - period)

    const [users, courses, communities, prompts, aiApps] = await Promise.all([
      supabase.from('users').select('created_at').gte('created_at', startDate.toISOString()),
      supabase.from('courses').select('created_at').gte('created_at', startDate.toISOString()).eq('is_active', true),
      supabase.from('communities').select('created_at').gte('created_at', startDate.toISOString()),
      supabase.from('ai_prompts').select('created_at').gte('created_at', startDate.toISOString()).eq('is_active', true),
      supabase.from('ai_apps').select('created_at').gte('created_at', startDate.toISOString()),
    ])

    const monthMap = buildEmptyMonthMap(period)
    incrementMonthlyMetric(monthMap, users.data, 'users')
    incrementMonthlyMetric(monthMap, courses.data, 'courses')
    incrementMonthlyMetric(monthMap, communities.data, 'communities')
    incrementMonthlyMetric(monthMap, prompts.data, 'prompts')
    incrementMonthlyMetric(monthMap, aiApps.data, 'aiApps')

    return Array.from(monthMap.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber,
    )
  } catch (error) {
    console.error('Error getting monthly growth:', error)
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
      communities: 0,
      prompts: 0,
      aiApps: 0,
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
