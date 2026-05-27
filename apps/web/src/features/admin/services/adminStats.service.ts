import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { AdminStats, AdminStatsWithChanges } from './admin-stats.types'

export type { AdminStats, AdminStatsWithChanges } from './admin-stats.types'

interface CountQueryResult {
  count: number | null
  error: unknown | null
}

interface ActiveSessionRow {
  user_id: string | null
}

interface ActiveSessionsQueryResult {
  data: ActiveSessionRow[] | null
  error: unknown | null
}

interface AdminPlatformStatsRow {
  total_users: number | string | null
  users_growth: number | string | null
  active_courses: number | string | null
  courses_growth: number | string | null
  total_organizations: number | string | null
  organizations_growth: number | string | null
  total_ai_apps: number | string | null
  ai_apps_growth: number | string | null
  total_news: number | string | null
  news_growth: number | string | null
  total_reels: number | string | null
  reels_growth: number | string | null
  total_favorites: number | string | null
  favorites_growth: number | string | null
  active_users: number | string | null
}

interface AdminPlatformStatsRpcClient {
  rpc(
    fn: 'get_admin_platform_stats',
    args?: Record<string, never>,
  ): PromiseLike<{
    data: AdminPlatformStatsRow[] | AdminPlatformStatsRow | null
    error: { message?: string } | null
  }>
}

function readCount(result: CountQueryResult): number {
  if (result.error) {
    throw result.error
  }

  return result.count ?? 0
}

function toCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function calculateGrowthPercentage(current: number, growth: number): number {
  if (current === 0) return 0
  if (growth === 0) return 0
  if (current <= growth) return 100

  const previous = current - growth
  if (previous <= 0) return 0

  const percentage = Math.round((growth / previous) * 100)
  return Math.max(0, Math.min(1000, percentage))
}

export class AdminStatsService {
  private static mapStatsRow(row: AdminPlatformStatsRow): AdminStatsWithChanges {
    const totalUsers = toCount(row.total_users)
    const usersGrowth = toCount(row.users_growth)
    const activeCourses = toCount(row.active_courses)
    const coursesGrowth = toCount(row.courses_growth)
    const totalOrganizations = toCount(row.total_organizations)
    const organizationsGrowth = toCount(row.organizations_growth)
    const totalAIApps = toCount(row.total_ai_apps)
    const aiAppsGrowth = toCount(row.ai_apps_growth)
    const totalNews = toCount(row.total_news)
    const newsGrowth = toCount(row.news_growth)
    const totalReels = toCount(row.total_reels)
    const reelsGrowth = toCount(row.reels_growth)
    const totalFavorites = toCount(row.total_favorites)
    const favoritesGrowth = toCount(row.favorites_growth)
    const activeUsers = toCount(row.active_users)

    return {
      totalUsers,
      activeCourses,
      totalOrganizations,
      totalAIApps,
      totalNews,
      totalReels,
      engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      userGrowth: calculateGrowthPercentage(totalUsers, usersGrowth),
      courseGrowth: calculateGrowthPercentage(activeCourses, coursesGrowth),
      organizationGrowth: calculateGrowthPercentage(totalOrganizations, organizationsGrowth),
      aiAppGrowth: calculateGrowthPercentage(totalAIApps, aiAppsGrowth),
      newsGrowth: calculateGrowthPercentage(totalNews, newsGrowth),
      reelsGrowth: calculateGrowthPercentage(totalReels, reelsGrowth),
      engagementGrowth: calculateGrowthPercentage(totalFavorites, favoritesGrowth),
    }
  }

  static async getStats(): Promise<AdminStatsWithChanges> {
    try {
      const supabase = await createClient()
      const { data: rpcData, error: rpcError } = await (
        supabase as unknown as AdminPlatformStatsRpcClient
      ).rpc('get_admin_platform_stats', {})

      if (!rpcError && rpcData) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
        if (row) {
          return this.mapStatsRow(row)
        }
      }

      if (rpcError) {
        logger.warn('Admin platform stats RPC unavailable, using fallback', {
          error: rpcError.message,
        })
      }

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoIso = sevenDaysAgo.toISOString()

      const [
        usersTotalResult,
        usersGrowthResult,
        coursesTotalResult,
        coursesGrowthResult,
        orgsTotalResult,
        orgsGrowthResult,
        aiAppsTotalResult,
        aiAppsGrowthResult,
        newsTotalResult,
        newsGrowthResult,
        reelsTotalResult,
        reelsGrowthResult,
        favoritesTotalResult,
        favoritesGrowthResult,
        activeUsersResult,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', thirtyDaysAgoIso),

        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', thirtyDaysAgoIso),

        supabase.from('ai_apps').select('app_id', { count: 'exact', head: true }),
        supabase.from('ai_apps').select('app_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('news').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        supabase.from('reels').select('id', { count: 'exact', head: true }),
        supabase.from('reels').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        supabase.from('user_favorites').select('id', { count: 'exact', head: true }),
        supabase.from('user_favorites').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        supabase.from('user_session').select('user_id', { head: false }).gte('issued_at', sevenDaysAgoIso).eq('revoked', false),
      ])

      const totalUsers = readCount(usersTotalResult as CountQueryResult)
      const usersGrowth = readCount(usersGrowthResult as CountQueryResult)
      const totalCourses = readCount(coursesTotalResult as CountQueryResult)
      const coursesGrowth = readCount(coursesGrowthResult as CountQueryResult)
      const totalOrgs = readCount(orgsTotalResult as CountQueryResult)
      const orgsGrowth = readCount(orgsGrowthResult as CountQueryResult)
      const totalAIApps = readCount(aiAppsTotalResult as CountQueryResult)
      const aiAppsGrowth = readCount(aiAppsGrowthResult as CountQueryResult)
      const totalNews = readCount(newsTotalResult as CountQueryResult)
      const newsGrowth = readCount(newsGrowthResult as CountQueryResult)
      const totalReels = readCount(reelsTotalResult as CountQueryResult)
      const reelsGrowth = readCount(reelsGrowthResult as CountQueryResult)
      const totalFavorites = readCount(favoritesTotalResult as CountQueryResult)
      const favoritesGrowth = readCount(favoritesGrowthResult as CountQueryResult)

      const activeSessions = activeUsersResult as ActiveSessionsQueryResult
      if (activeSessions.error) {
        throw activeSessions.error
      }

      const activeUsers = new Set(
        activeSessions.data?.map((session) => session.user_id).filter(Boolean)
      ).size
      const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      const stats: AdminStatsWithChanges = {
        totalUsers,
        activeCourses: totalCourses,
        totalOrganizations: totalOrgs,
        totalAIApps,
        totalNews,
        totalReels,
        engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowth),
        courseGrowth: calculateGrowthPercentage(totalCourses, coursesGrowth),
        organizationGrowth: calculateGrowthPercentage(totalOrgs, orgsGrowth),
        aiAppGrowth: calculateGrowthPercentage(totalAIApps, aiAppsGrowth),
        newsGrowth: calculateGrowthPercentage(totalNews, newsGrowth),
        reelsGrowth: calculateGrowthPercentage(totalReels, reelsGrowth),
        engagementGrowth: calculateGrowthPercentage(totalFavorites, favoritesGrowth)
      }

      return stats
    } catch (error) {
      const defaultStats: AdminStatsWithChanges = {
        totalUsers: 0,
        activeCourses: 0,
        totalOrganizations: 0,
        totalAIApps: 0,
        totalNews: 0,
        totalReels: 0,
        engagementRate: 0,
        userGrowth: 0,
        courseGrowth: 0,
        organizationGrowth: 0,
        aiAppGrowth: 0,
        newsGrowth: 0,
        reelsGrowth: 0,
        engagementGrowth: 0
      }

      return defaultStats
    }
  }
}
