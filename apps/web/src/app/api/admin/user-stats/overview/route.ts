import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface OverviewStats {
  activeUsers30d: number
  completionRate: number
  studyHoursMonth: number
  certificatesMonth: number
  usersByOrganization: Array<{ name: string; count: number }>
  dailyActivity: Array<{ date: string; count: number }>
  progressDistribution: Array<{ range: string; count: number }>
  roleDistribution: Array<{ role: string; count: number }>
}

interface UserStatsOverviewRpcClient {
  rpc(
    fn: 'get_admin_user_stats_overview',
    args?: Record<string, never>,
  ): PromiseLike<{
    data: OverviewStats | null
    error: { message?: string } | null
  }>
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()
    const { data: rpcOverview, error: rpcError } = await (
      supabase as unknown as UserStatsOverviewRpcClient
    ).rpc('get_admin_user_stats_overview', {})

    if (!rpcError && rpcOverview) {
      return NextResponse.json(rpcOverview, { headers: cacheHeaders.privateShort })
    }

    if (rpcError) {
      logger.warn('Admin user stats overview RPC unavailable, using fallback', {
        error: rpcError.message,
      })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Parallel queries
    const [
      activeUsersRes,
      enrollmentsRes,
      studyMinutesRes,
      certificatesRes,
      orgUsersRes,
      dailyActivityRes,
      progressRes,
    ] = await Promise.all([
      // Active users (30d)
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login_at', thirtyDaysAgo),
      // All enrollments for completion rate
      supabase.from('user_course_enrollments').select('enrollment_status'),
      // Study minutes this month
      supabase.from('daily_progress').select('study_minutes').gte('progress_date', monthStart),
      // Certificates this month
      supabase.from('user_course_certificates').select('certificate_id', { count: 'exact', head: true }).gte('issued_at', monthStart),
      // Organization users with org names
      supabase.from('organization_users').select('organization_id, role, organizations(name)').eq('status', 'active'),
      // Daily activity last 30 days
      supabase.from('daily_progress').select('progress_date, had_activity').gte('progress_date', thirtyDaysAgo.split('T')[0]).eq('had_activity', true),
      // Progress distribution
      supabase.from('user_course_enrollments').select('overall_progress_percentage').not('overall_progress_percentage', 'is', null),
    ])

    // Active users count
    const activeUsers30d = activeUsersRes.count ?? 0

    // Completion rate
    const enrollments = enrollmentsRes.data || []
    const completedCount = enrollments.filter(e => e.enrollment_status === 'completed').length
    const completionRate = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0

    // Study hours this month
    const totalMinutes = (studyMinutesRes.data || []).reduce((sum, d) => sum + (d.study_minutes || 0), 0)
    const studyHoursMonth = Math.round((totalMinutes / 60) * 10) / 10

    // Certificates this month
    const certificatesMonth = certificatesRes.count ?? 0

    // Users by organization
    const orgMap = new Map<string, number>()
    for (const ou of (orgUsersRes.data || [])) {
      const orgName = (ou.organizations as { name?: string | null } | null)?.name || 'Sin organización'
      orgMap.set(orgName, (orgMap.get(orgName) || 0) + 1)
    }
    const usersByOrganization = Array.from(orgMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Daily activity
    const dayMap = new Map<string, number>()
    for (const dp of (dailyActivityRes.data || [])) {
      const date = dp.progress_date
      dayMap.set(date, (dayMap.get(date) || 0) + 1)
    }
    const dailyActivity = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Progress distribution
    const progressBuckets = [
      { range: '0%', min: 0, max: 0 },
      { range: '1-25%', min: 1, max: 25 },
      { range: '26-50%', min: 26, max: 50 },
      { range: '51-75%', min: 51, max: 75 },
      { range: '76-99%', min: 76, max: 99 },
      { range: '100%', min: 100, max: 100 },
    ]
    const progressDistribution = progressBuckets.map(bucket => {
      const count = (progressRes.data || []).filter(e => {
        const p = Number(e.overall_progress_percentage) || 0
        return p >= bucket.min && p <= bucket.max
      }).length
      return { range: bucket.range, count }
    })

    // Role distribution
    const roleMap = new Map<string, number>()
    for (const ou of (orgUsersRes.data || [])) {
      const role = ou.role || 'member'
      roleMap.set(role, (roleMap.get(role) || 0) + 1)
    }
    const roleDistribution = Array.from(roleMap.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(
      {
        activeUsers30d,
        completionRate,
        studyHoursMonth,
        certificatesMonth,
        usersByOrganization,
        dailyActivity,
        progressDistribution,
        roleDistribution,
      },
      { headers: cacheHeaders.privateShort },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
