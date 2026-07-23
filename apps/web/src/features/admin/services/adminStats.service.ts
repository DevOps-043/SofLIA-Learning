import { createClient } from '@/lib/supabase/server'
import { statsTable } from './admin-statistics/stats-query.client'
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

function readCount(result: CountQueryResult): number {
  if (result.error) {
    throw result.error
  }

  return result.count ?? 0
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

const EMPTY_STATS: AdminStatsWithChanges = {
  totalUsers: 0,
  activeCourses: 0,
  totalOrganizations: 0,
  engagementRate: 0,
  userGrowth: 0,
  courseGrowth: 0,
  organizationGrowth: 0,
}

export class AdminStatsService {
  /**
   * Métricas del dashboard de administración.
   *
   * Se calculan con counts directos sobre las tablas reales de la plataforma B2B
   * (usuarios, cursos, organizaciones, sesiones activas). Antes se intentaba una
   * RPC `get_admin_platform_stats` que no existe en la base (404 por carga) y un
   * fallback que contaba tablas de features ya eliminadas (ai_apps, news, reels,
   * user_favorites → 404 cada una), lo que hacía caer todo el cálculo al catch y
   * devolver ceros. Ambas fuentes de error se eliminaron.
   */
  static async getStats(): Promise<AdminStatsWithChanges> {
    try {
      const supabase = await createClient()

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
        activeUsersResult,
      ] = await Promise.all([
        statsTable<unknown>(supabase, 'users').select('id', { count: 'exact', head: true }),
        statsTable<unknown>(supabase, 'users').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoIso),

        statsTable<unknown>(supabase, 'courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        statsTable<unknown>(supabase, 'courses').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', thirtyDaysAgoIso),

        statsTable<unknown>(supabase, 'organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        statsTable<unknown>(supabase, 'organizations').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', thirtyDaysAgoIso),

        statsTable<ActiveSessionRow>(supabase, 'user_session').select('user_id', { head: false }).gte('issued_at', sevenDaysAgoIso).eq('revoked', false),
      ])

      const totalUsers = readCount(usersTotalResult as CountQueryResult)
      const usersGrowth = readCount(usersGrowthResult as CountQueryResult)
      const totalCourses = readCount(coursesTotalResult as CountQueryResult)
      const coursesGrowth = readCount(coursesGrowthResult as CountQueryResult)
      const totalOrgs = readCount(orgsTotalResult as CountQueryResult)
      const orgsGrowth = readCount(orgsGrowthResult as CountQueryResult)

      const activeSessions = activeUsersResult as ActiveSessionsQueryResult
      if (activeSessions.error) {
        throw activeSessions.error
      }

      const activeUsers = new Set(
        activeSessions.data?.map((session) => session.user_id).filter(Boolean)
      ).size
      const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      return {
        totalUsers,
        activeCourses: totalCourses,
        totalOrganizations: totalOrgs,
        engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowth),
        courseGrowth: calculateGrowthPercentage(totalCourses, coursesGrowth),
        organizationGrowth: calculateGrowthPercentage(totalOrgs, orgsGrowth),
      }
    } catch {
      return EMPTY_STATS
    }
  }
}
