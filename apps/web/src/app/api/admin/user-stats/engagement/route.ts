import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface EngagementStats {
  activationRate: number
  weeklyReturn: number
  avgSatisfaction: number
  inactiveUsers30d: number
  newVsRecurring: Array<{ week: string; new: number; recurring: number }>
  ratingDistribution: Array<{ rating: number; count: number }>
  engagementByOrg: Array<{ org: string; ratio: number; active: number; total: number }>
  usersByCountry: Array<{ country: string; count: number }>
}

interface UserStatsEngagementRpcClient {
  rpc(
    fn: 'get_admin_user_stats_engagement',
    args?: Record<string, never>,
  ): PromiseLike<{
    data: EngagementStats | null
    error: { message?: string } | null
  }>
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()
    const { data: rpcEngagement, error: rpcError } = await (
      supabase as unknown as UserStatsEngagementRpcClient
    ).rpc('get_admin_user_stats_engagement', {})

    if (!rpcError && rpcEngagement) {
      return NextResponse.json(rpcEngagement, { headers: cacheHeaders.privateShort })
    }

    if (rpcError) {
      logger.warn('Admin user engagement stats RPC unavailable, using fallback', {
        error: rpcError.message,
      })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const thisWeekStart = getWeekStart(now)
    const lastWeekStart = new Date(new Date(thisWeekStart).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      totalUsersRes,
      usersWithEnrollRes,
      reviewsRes,
      inactiveRes,
      dailyProgressRes,
      newUsersRes,
      orgAnalyticsRes,
      userCountryRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('user_id'),
      supabase.from('course_reviews').select('rating'),
      supabase.from('users').select('id', { count: 'exact', head: true }).or(`last_login_at.is.null,last_login_at.lt.${thirtyDaysAgo}`),
      // Activity this week and last week
      supabase.from('daily_progress').select('user_id, progress_date, had_activity').gte('progress_date', lastWeekStart).eq('had_activity', true),
      // New users per week (last 8 weeks)
      supabase.from('users').select('id, created_at').gte('created_at', new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString()),
      // Org analytics (latest per org)
      supabase.from('organization_analytics').select('organization_id, active_users, total_users, organizations(name)').order('date', { ascending: false }),
      // Users by country
      supabase.from('users').select('country_code').not('country_code', 'is', null),
    ])

    const totalUsers = totalUsersRes.count ?? 0

    // Activation rate
    const usersWithEnroll = new Set((usersWithEnrollRes.data || []).map(e => e.user_id)).size
    const activationRate = totalUsers > 0 ? Math.round((usersWithEnroll / totalUsers) * 100) : 0

    // Weekly return
    const dailyProgress = dailyProgressRes.data || []
    const thisWeekUsers = new Set(dailyProgress.filter(d => d.progress_date >= thisWeekStart).map(d => d.user_id))
    const lastWeekUsers = new Set(dailyProgress.filter(d => d.progress_date >= lastWeekStart && d.progress_date < thisWeekStart).map(d => d.user_id))
    const returningUsers = [...thisWeekUsers].filter(u => lastWeekUsers.has(u)).length
    const weeklyReturn = lastWeekUsers.size > 0 ? Math.round((returningUsers / lastWeekUsers.size) * 100) : 0

    // Average satisfaction
    const reviews = reviewsRes.data || []
    const avgSatisfaction = reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0

    // Inactive users
    const inactiveUsers30d = inactiveRes.count ?? 0

    // New vs recurring by week (last 8 weeks)
    const newUsers = newUsersRes.data || []
    const weekBuckets = new Map<string, { new: number; recurring: number }>()
    for (let i = 0; i < 8; i++) {
      const weekStart = getWeekStart(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000))
      weekBuckets.set(weekStart, { new: 0, recurring: 0 })
    }
    for (const u of newUsers) {
      const ws = getWeekStart(new Date(u.created_at))
      const bucket = weekBuckets.get(ws)
      if (bucket) bucket.new++
    }
    // Recurring = active users that week who were NOT created that week
    const newUserIds = new Set(newUsers.map(u => u.id))
    for (const dp of dailyProgress) {
      const ws = getWeekStart(new Date(dp.progress_date))
      const bucket = weekBuckets.get(ws)
      if (bucket && !newUserIds.has(dp.user_id)) {
        bucket.recurring++
      }
    }
    const newVsRecurring = Array.from(weekBuckets.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
    }))

    // Engagement by org (latest entry per org)
    const orgSeen = new Set<string>()
    const engagementByOrg: { org: string; ratio: number; active: number; total: number }[] = []
    for (const oa of (orgAnalyticsRes.data || [])) {
      if (orgSeen.has(oa.organization_id)) continue
      orgSeen.add(oa.organization_id)
      const orgName = (oa.organizations as { name?: string | null } | null)?.name || 'Org desconocida'
      const total = oa.total_users || 0
      const active = oa.active_users || 0
      engagementByOrg.push({
        org: orgName,
        ratio: total > 0 ? Math.round((active / total) * 100) : 0,
        active,
        total,
      })
    }
    engagementByOrg.sort((a, b) => b.ratio - a.ratio)

    // Users by country
    const countryMap = new Map<string, number>()
    for (const u of (userCountryRes.data || [])) {
      const c = u.country_code || 'Desconocido'
      countryMap.set(c, (countryMap.get(c) || 0) + 1)
    }
    const usersByCountry = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(
      {
        activationRate,
        weeklyReturn,
        avgSatisfaction,
        inactiveUsers30d,
        newVsRecurring,
        ratingDistribution: ratingDist,
        engagementByOrg,
        usersByCountry,
      },
      { headers: cacheHeaders.privateShort },
    )
  } catch (error) {
    logger.error('Unexpected error in admin user stats engagement route', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}
