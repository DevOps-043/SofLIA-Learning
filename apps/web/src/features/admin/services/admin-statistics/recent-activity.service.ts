import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_STATS_COLORS } from './constants'
import { statsTable } from './stats-query.client'
import { getTimeAgo } from './time-ago'
import type { RecentActivity } from './types'

type ActivityPeriod = '24h' | '7d' | '30d'
type ActivityRow = Record<string, string | null>

export async function getRecentActivity(
  period: string = '24h',
): Promise<RecentActivity[]> {
  try {
    const supabase = await createClient()
    const startDateISO = getActivityStartDate(period as ActivityPeriod).toISOString()
    // Solo actividad sobre entidades B2B reales. Las de features consumer
    // (communities, ai_prompts, ai_apps) se retiraron con sus tablas (404).
    const [newUsers, newCourses] = await Promise.all([
      statsTable<ActivityRow>(supabase, 'users').select('id, created_at').gte('created_at', startDateISO).order('created_at', { ascending: false }).limit(100),
      statsTable<ActivityRow>(supabase, 'courses').select('id, created_at').gte('created_at', startDateISO).eq('is_active', true).order('created_at', { ascending: false }).limit(100),
    ])

    return [
      buildActivity('users', newUsers.data, 'id', 'user_registered'),
      buildActivity('courses', newCourses.data, 'id', 'course_created'),
    ]
      .filter((activity): activity is RecentActivity => Boolean(activity))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  } catch (error) {
    techDebtLogger.error('Error getting recent activity:', error)
    return []
  }
}

function getActivityStartDate(period: ActivityPeriod): Date {
  const startDate = new Date()

  if (period === '7d') startDate.setDate(startDate.getDate() - 7)
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30)
  else startDate.setHours(startDate.getHours() - 24)

  return startDate
}

function buildActivity(
  scope: 'users' | 'courses',
  rows: ActivityRow[] | null,
  idKey: string,
  type: RecentActivity['type'],
): RecentActivity | null {
  if (!rows || rows.length === 0) return null

  const copy = ACTIVITY_COPY[scope]
  const first = rows[0]
  return {
    id: `${scope}-${first[idKey] || 'unknown'}`,
    type,
    description: rows.length > 1 ? `${rows.length} ${copy.plural}` : `1 ${copy.singular}`,
    timestamp: first.created_at || new Date().toISOString(),
    timeAgo: getTimeAgo(first.created_at || new Date().toISOString()),
    color: copy.color,
  }
}

const ACTIVITY_COPY = {
  users: { singular: 'nuevo usuario registrado', plural: 'nuevos usuarios registrados', color: ADMIN_STATS_COLORS.users },
  courses: { singular: 'nuevo curso creado', plural: 'nuevos cursos creados', color: ADMIN_STATS_COLORS.courses },
} as const
