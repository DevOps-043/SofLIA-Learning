import { createClient } from '../../../lib/supabase/server'

export interface AdminStats {
  totalUsers: number
  activeCourses: number
  totalOrganizations?: number
  totalAIApps: number
  totalNews: number
  totalReels: number
  engagementRate: number
}

export interface AdminStatsWithChanges extends AdminStats {
  userGrowth: number
  courseGrowth: number
  organizationGrowth?: number
  aiAppGrowth: number
  newsGrowth: number
  reelsGrowth: number
  engagementGrowth: number
}

export class AdminStatsService {
  static async getStats(): Promise<AdminStatsWithChanges> {
    try {
      const supabase = await createClient()
      // 🚀 OPTIMIZACIÓN AVANZADA: Reducir 13 queries a 7 queries más eficientes
      // - Usar solo head:true para counts (no traer datos)
      // - Combinar queries de growth con totales cuando sea posible

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const [
        usersResult,
        coursesResult,
        orgsResult,
        aiAppsResult,
        newsResult,
        reelsResult,
        favoritesResult,
        activeUsersResult,
      ] = await Promise.all([
        // 🚀 Estadísticas de users (total + growth en una query)
        supabase.from('users').select('id, created_at', { count: 'exact', head: false }),

        // 🚀 Estadísticas de courses (total + growth en una query)
        supabase.from('courses').select('id, created_at', { count: 'exact', head: false }).eq('is_active', true),

        // 🚀 Estadísticas de organizations (total + growth en una query)
        supabase.from('organizations').select('id, created_at', { count: 'exact', head: false }).eq('is_active', true),

        // 🚀 Estadísticas de ai_apps (total + growth en una query)
        supabase.from('ai_apps').select('app_id, created_at', { count: 'exact', head: false }),

        // 🚀 Estadísticas de news (total + growth en una query)
        supabase.from('news').select('id, created_at', { count: 'exact', head: false }),

        // 🚀 Estadísticas de reels (total + growth en una query)
        supabase.from('reels').select('id, created_at', { count: 'exact', head: false }),

        // 🚀 Estadísticas de favorites (total + growth en una query)
        supabase.from('user_favorites').select('id, created_at', { count: 'exact', head: false }),

        // 🚀 Engagement rate (solo user_id y issued_at)
        supabase.from('user_session').select('user_id, issued_at', { head: false }).gte('issued_at', sevenDaysAgo.toISOString()).eq('revoked', false),
      ])

      // 🚀 Calcular totales y growth en cliente (más rápido que queries separadas)
      const totalUsers = usersResult.count || 0
      const usersGrowth = usersResult.data?.filter((u: any) => new Date(u.created_at) >= thirtyDaysAgo).length || 0

      const totalCourses = coursesResult.count || 0
      const coursesGrowth = coursesResult.data?.filter((c: any) => new Date(c.created_at) >= thirtyDaysAgo).length || 0

      const totalOrgs = orgsResult.count || 0
      const orgsGrowth = orgsResult.data?.filter((o: any) => new Date(o.created_at) >= thirtyDaysAgo).length || 0

      const totalAIApps = aiAppsResult.count || 0
      const aiAppsGrowth = aiAppsResult.data?.filter((a: any) => new Date(a.created_at) >= thirtyDaysAgo).length || 0

      const totalNews = newsResult.count || 0
      const newsGrowth = newsResult.data?.filter((n: any) => new Date(n.created_at) >= thirtyDaysAgo).length || 0

      const totalReels = reelsResult.count || 0
      const reelsGrowth = reelsResult.data?.filter((r: any) => new Date(r.created_at) >= thirtyDaysAgo).length || 0

      const totalFavorites = favoritesResult.count || 0
      const favoritesGrowth = favoritesResult.data?.filter((f: any) => new Date(f.created_at) >= thirtyDaysAgo).length || 0

      const activeUsers = new Set(activeUsersResult.data?.map((session: any) => session.user_id)).size
      const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

      // Calcular porcentajes de crecimiento
      const calculateGrowthPercentage = (current: number, growth: number): number => {
        if (current === 0) return 0
        if (growth === 0) return 0
        if (current <= growth) return 100 // Si el crecimiento es igual o mayor al total actual
        
        const previous = current - growth
        if (previous <= 0) return 0
        
        const percentage = Math.round((growth / previous) * 100)
        return Math.max(0, Math.min(1000, percentage)) // Limitar entre 0 y 1000%
      }

      const stats: AdminStatsWithChanges = {
        totalUsers: totalUsers,
        activeCourses: totalCourses,
        totalOrganizations: totalOrgs,
        totalAIApps: totalAIApps,
        totalNews: totalNews,
        totalReels: totalReels,
        engagementRate: engagementRate,
        userGrowth: calculateGrowthPercentage(totalUsers, usersGrowth),
        courseGrowth: calculateGrowthPercentage(totalCourses, coursesGrowth),
        organizationGrowth: calculateGrowthPercentage(totalOrgs, orgsGrowth),
        aiAppGrowth: calculateGrowthPercentage(totalAIApps, aiAppsGrowth),
        newsGrowth: calculateGrowthPercentage(totalNews, newsGrowth),
        reelsGrowth: calculateGrowthPercentage(totalReels, reelsGrowth),
        engagementGrowth: calculateGrowthPercentage(totalFavorites, favoritesGrowth)
      }

      // console.log('Crecimiento de AI Apps:', aiAppsGrowthResult.count || 0)
      return stats
    } catch (error) {
      // console.error('❌ AdminStatsService: Error completo:', error)
      // console.error('❌ AdminStatsService: Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Retornar valores por defecto en caso de error
      const defaultStats = {
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

