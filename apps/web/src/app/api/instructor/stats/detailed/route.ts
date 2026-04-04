import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'

// Función helper para calcular fechas según el período
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate = new Date()

  switch (period) {
    case '1month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
      break
    case '3months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1)
      break
    case '6months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1)
      break
    case '1year':
      startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1)
      break
    default:
      // Por defecto, último mes
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
  }

  return { startDate, endDate }
}

// Helper para convertir country_code (ISO 3166-1 alpha-2) a ISO 3166-1 alpha-3
// Formato usado por el GeoJSON de Nivo
const countryCodeToAlpha3: Record<string, string> = {
  MX: 'MEX', US: 'USA', ES: 'ESP', AR: 'ARG', CO: 'COL', CL: 'CHL',
  PE: 'PER', VE: 'VEN', EC: 'ECU', GT: 'GTM', CU: 'CUB', BO: 'BOL',
  DO: 'DOM', HN: 'HND', PY: 'PRY', SV: 'SLV', NI: 'NIC', CR: 'CRI',
  PA: 'PAN', UY: 'URY', BR: 'BRA', PT: 'PRT', FR: 'FRA', DE: 'DEU',
  IT: 'ITA', GB: 'GBR', CA: 'CAN', AU: 'AUS', NZ: 'NZL', JP: 'JPN',
  CN: 'CHN', IN: 'IND', KR: 'KOR', RU: 'RUS', ZA: 'ZAF', EG: 'EGY',
  // Agregar más según necesidad
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const instructorId = auth.userId

    // Obtener período de query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1month'
    const { startDate, endDate } = getDateRange(period)

    logger.log('🔄 Obteniendo estadísticas detalladas del instructor:', instructorId, 'período:', period)

    // ========== ESTADÍSTICAS DE RRHH ==========

    // 🚀 OPTIMIZACIÓN: Obtener IDs de cursos y comunidades en paralelo
    const [
      { data: instructorCourses },
      { data: instructorCommunities }
    ] = await Promise.all([
      supabase.from('courses').select('id').eq('instructor_id', instructorId),
      supabase.from('communities').select('id').eq('creator_id', instructorId)
    ])

    const courseIds = (instructorCourses || []).map(c => c.id)
    const communityIds = (instructorCommunities || []).map(c => c.id)

    // 🚀 OPTIMIZACIÓN: Obtener usuarios de cursos y comunidades en paralelo
    let userIds: string[] = []

    const enrollmentsPromise = courseIds.length > 0
      ? supabase
          .from('user_course_enrollments')
          .select('user_id')
          .in('course_id', courseIds)
          .gte('enrolled_at', startDate.toISOString())
          .lte('enrolled_at', endDate.toISOString())
      : Promise.resolve({ data: [] })

    const membersPromise = communityIds.length > 0
      ? supabase
          .from('community_members')
          .select('user_id')
          .in('community_id', communityIds)
          .gte('joined_at', startDate.toISOString())
          .lte('joined_at', endDate.toISOString())
      : Promise.resolve({ data: [] })

    const [{ data: enrollments }, { data: members }] = await Promise.all([
      enrollmentsPromise,
      membersPromise
    ])

    userIds = [...new Set([
      ...((enrollments || []).map(e => e.user_id)),
      ...((members || []).map(m => m.user_id))
    ])]

    // 🚀 OPTIMIZACIÓN: Combinar queries de usuarios (country_code + created_at en una sola query)
    const usersByCountry: Record<string, number> = {}
    const registrationsByDate: Record<string, number> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('country_code, created_at')
        .in('id', userIds)

      ;(users || []).forEach(user => {
        // Usuarios por país
        if (user.country_code) {
          const countryCode = countryCodeToAlpha3[user.country_code.toUpperCase()] || user.country_code.toUpperCase()
          usersByCountry[countryCode] = (usersByCountry[countryCode] || 0) + 1
        }

        // Registros por fecha (solo dentro del rango)
        const createdAt = new Date(user.created_at)
        if (createdAt >= startDate && createdAt <= endDate) {
          const date = createdAt.toISOString().split('T')[0]
          registrationsByDate[date] = (registrationsByDate[date] || 0) + 1
        }
      })
    }

    // Demografía usando user_perfil
    const demographics = {
      byRole: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byArea: {} as Record<string, number>,
      bySector: {} as Record<string, number>,
      byCompanySize: {} as Record<string, number>,
      byRelation: {} as Record<string, number>,
      verifiedUsers: 0
    }

    if (userIds.length > 0) {
      // 🚀 OPTIMIZACIÓN: Obtener perfiles, usuarios verificados y lookup tables en paralelo
      const [
        { data: profiles },
        { data: verified },
        rolesRes,
        nivelesRes,
        areasRes,
        sectoresRes,
        tamanosRes,
        relacionesRes
      ] = await Promise.all([
        supabase.from('user_perfil').select('rol_id, nivel_id, area_id, sector_id, tamano_id, relacion_id').in('user_id', userIds),
        supabase.from('users').select('id').in('id', userIds).eq('email_verified', true),
        supabase.from('roles').select('id, nombre'),
        supabase.from('niveles').select('id, nombre'),
        supabase.from('areas').select('id, nombre'),
        supabase.from('sectores').select('id, nombre'),
        supabase.from('tamanos_empresa').select('id, nombre'),
        supabase.from('relaciones').select('id, nombre')
      ])

      demographics.verifiedUsers = verified?.length || 0

      const rolesMap = new Map((rolesRes.data || []).map(r => [r.id, r.nombre]))
      const nivelesMap = new Map((nivelesRes.data || []).map(n => [n.id, n.nombre]))
      const areasMap = new Map((areasRes.data || []).map(a => [a.id, a.nombre]))
      const sectoresMap = new Map((sectoresRes.data || []).map(s => [s.id, s.nombre]))
      const tamanosMap = new Map((tamanosRes.data || []).map(t => [t.id, t.nombre]))
      const relacionesMap = new Map((relacionesRes.data || []).map(r => [r.id, r.nombre]))

      ;(profiles || []).forEach(profile => {
        if (profile.rol_id) {
          const roleName = rolesMap.get(profile.rol_id) || 'Sin rol'
          demographics.byRole[roleName] = (demographics.byRole[roleName] || 0) + 1
        }
        if (profile.nivel_id) {
          const levelName = nivelesMap.get(profile.nivel_id) || 'Sin nivel'
          demographics.byLevel[levelName] = (demographics.byLevel[levelName] || 0) + 1
        }
        if (profile.area_id) {
          const areaName = areasMap.get(profile.area_id) || 'Sin área'
          demographics.byArea[areaName] = (demographics.byArea[areaName] || 0) + 1
        }
        if (profile.sector_id) {
          const sectorName = sectoresMap.get(profile.sector_id) || 'Sin sector'
          demographics.bySector[sectorName] = (demographics.bySector[sectorName] || 0) + 1
        }
        if (profile.tamano_id) {
          const tamanoName = tamanosMap.get(profile.tamano_id) || 'Sin tamaño'
          demographics.byCompanySize[tamanoName] = (demographics.byCompanySize[tamanoName] || 0) + 1
        }
        if (profile.relacion_id) {
          const relacionName = relacionesMap.get(profile.relacion_id) || 'Sin relación'
          demographics.byRelation[relacionName] = (demographics.byRelation[relacionName] || 0) + 1
        }
      })
    }

    // ========== ESTADÍSTICAS DE CURSOS ==========
    
    const coursesData = {
      totalCourses: courseIds.length,
      totalStudents: 0,
      averageRating: 0,
      totalRevenue: 0,
      studentsByCourse: [] as Array<{ courseId: string; courseTitle: string; studentCount: number }>,
      progressByCourse: [] as Array<{ courseId: string; courseTitle: string; averageProgress: number }>,
      completionByCourse: [] as Array<{ courseId: string; courseTitle: string; completionRate: number }>,
      ratingsByCourse: [] as Array<{ courseId: string; courseTitle: string; averageRating: number }>,
      revenueByCourse: [] as Array<{ courseId: string; courseTitle: string; revenue: number }>,
      enrollmentsByDate: {} as Record<string, number>
    }

    if (courseIds.length > 0) {
      // 🚀 OPTIMIZACIÓN: Obtener cursos, enrollments y compras en paralelo
      const [
        { data: courses },
        { data: enrollments },
        { data: purchases }
      ] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, student_count, average_rating')
          .eq('instructor_id', instructorId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('user_course_enrollments')
          .select('course_id, overall_progress_percentage, enrollment_status, enrolled_at')
          .in('course_id', courseIds)
          .gte('enrolled_at', startDate.toISOString())
          .lte('enrolled_at', endDate.toISOString()),
        supabase
          .from('course_purchases')
          .select('course_id, final_price_cents')
          .in('course_id', courseIds)
          .eq('access_status', 'active')
          .gte('purchased_at', startDate.toISOString())
          .lte('purchased_at', endDate.toISOString())
      ])

      // Procesar datos
      ;(courses || []).forEach(course => {
        const courseEnrollments = (enrollments || []).filter(e => e.course_id === course.id)
        const coursePurchases = (purchases || []).filter(p => p.course_id === course.id)

        coursesData.totalStudents += course.student_count || 0
        coursesData.studentsByCourse.push({
          courseId: course.id,
          courseTitle: course.title,
          studentCount: course.student_count || 0
        })

        if (course.average_rating) {
          coursesData.ratingsByCourse.push({
            courseId: course.id,
            courseTitle: course.title,
            averageRating: course.average_rating
          })
        }

        const totalProgress = courseEnrollments.reduce((sum, e) => sum + (Number(e.overall_progress_percentage) || 0), 0)
        const avgProgress = courseEnrollments.length > 0 ? totalProgress / courseEnrollments.length : 0
        coursesData.progressByCourse.push({
          courseId: course.id,
          courseTitle: course.title,
          averageProgress: avgProgress
        })

        const completed = courseEnrollments.filter(e => e.enrollment_status === 'completed' || (Number(e.overall_progress_percentage) || 0) >= 100).length
        const completionRate = courseEnrollments.length > 0 ? (completed / courseEnrollments.length) * 100 : 0
        coursesData.completionByCourse.push({
          courseId: course.id,
          courseTitle: course.title,
          completionRate
        })

        const revenue = coursePurchases.reduce((sum, p) => sum + ((p.final_price_cents || 0) / 100), 0)
        coursesData.totalRevenue += revenue
        coursesData.revenueByCourse.push({
          courseId: course.id,
          courseTitle: course.title,
          revenue
        })
      })

      // Calcular promedio de rating
      const coursesWithRating = (courses || []).filter(c => c.average_rating && c.average_rating > 0)
      coursesData.averageRating = coursesWithRating.length > 0
        ? coursesWithRating.reduce((sum, c) => sum + (c.average_rating || 0), 0) / coursesWithRating.length
        : 0

      // Enrollments por fecha
      ;(enrollments || []).forEach(e => {
        const date = new Date(e.enrolled_at).toISOString().split('T')[0]
        coursesData.enrollmentsByDate[date] = (coursesData.enrollmentsByDate[date] || 0) + 1
      })
    }

    // ========== ESTADÍSTICAS DE COMUNIDADES ==========
    
    const communitiesData = {
      totalCommunities: communityIds.length,
      totalMembers: 0,
      totalPosts: 0,
      totalComments: 0,
      membersByCommunity: [] as Array<{ communityId: string; communityName: string; memberCount: number }>,
      postsByCommunity: [] as Array<{ communityId: string; communityName: string; postCount: number }>,
      commentsByCommunity: [] as Array<{ communityId: string; communityName: string; commentCount: number }>,
      activityByCommunity: [] as Array<{ communityId: string; communityName: string; activityScore: number }>,
      pointsByCommunity: [] as Array<{ communityId: string; communityName: string; totalPoints: number }>,
      activityByDate: {} as Record<string, { posts: number; comments: number }>
    }

    if (communityIds.length > 0) {
      // 🚀 OPTIMIZACIÓN: Obtener comunidades, miembros, posts y comentarios en paralelo
      const [
        { data: communities },
        { data: members },
        { data: posts },
        { data: comments }
      ] = await Promise.all([
        supabase
          .from('communities')
          .select('id, name, member_count')
          .eq('creator_id', instructorId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('community_members')
          .select('community_id')
          .in('community_id', communityIds)
          .gte('joined_at', startDate.toISOString())
          .lte('joined_at', endDate.toISOString()),
        supabase
          .from('community_posts')
          .select('community_id, created_at, likes_count, comments_count')
          .in('community_id', communityIds)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('community_comments')
          .select('community_id, created_at')
          .in('community_id', communityIds)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ])

      ;(communities || []).forEach(community => {
        const communityMembers = (members || []).filter(m => m.community_id === community.id)
        const communityPosts = (posts || []).filter(p => p.community_id === community.id)
        const communityComments = (comments || []).filter(c => c.community_id === community.id)

        communitiesData.totalMembers += community.member_count || 0
        communitiesData.totalPosts += communityPosts.length
        communitiesData.totalComments += communityComments.length

        communitiesData.membersByCommunity.push({
          communityId: community.id,
          communityName: community.name,
          memberCount: community.member_count || 0
        })

        communitiesData.postsByCommunity.push({
          communityId: community.id,
          communityName: community.name,
          postCount: communityPosts.length
        })

        communitiesData.commentsByCommunity.push({
          communityId: community.id,
          communityName: community.name,
          commentCount: communityComments.length
        })

        const activityScore = communityPosts.length * 2 + communityComments.length
        communitiesData.activityByCommunity.push({
          communityId: community.id,
          communityName: community.name,
          activityScore
        })

        // Calcular puntos (likes + comments)
        const totalPoints = communityPosts.reduce((sum, p) => sum + ((p.likes_count || 0) + (p.comments_count || 0)), 0)
        communitiesData.pointsByCommunity.push({
          communityId: community.id,
          communityName: community.name,
          totalPoints
        })
      })

      // Actividad por fecha
      ;(posts || []).forEach(p => {
        const date = new Date(p.created_at).toISOString().split('T')[0]
        if (!communitiesData.activityByDate[date]) {
          communitiesData.activityByDate[date] = { posts: 0, comments: 0 }
        }
        communitiesData.activityByDate[date].posts += 1
      })

      ;(comments || []).forEach(c => {
        const date = new Date(c.created_at).toISOString().split('T')[0]
        if (!communitiesData.activityByDate[date]) {
          communitiesData.activityByDate[date] = { posts: 0, comments: 0 }
        }
        communitiesData.activityByDate[date].comments += 1
      })
    }

    // ========== ESTADÍSTICAS DE NOTICIAS Y REELS ==========

    // 🚀 OPTIMIZACIÓN: Obtener news y reels en paralelo
    const [
      { data: instructorNews },
      { data: instructorReels }
    ] = await Promise.all([
      supabase
        .from('news')
        .select('id, title, slug, status, metrics, created_at, published_at')
        .eq('created_by', instructorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('reels')
        .select('id, title, view_count, like_count, share_count, comment_count, is_active, created_at, published_at')
        .eq('created_by', instructorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ])

    const newsData = {
      totalNews: instructorNews?.length || 0,
      publishedNews: (instructorNews || []).filter(n => n.status === 'published').length,
      totalViews: 0,
      totalComments: 0,
      viewsByDate: {} as Record<string, number>,
      commentsByDate: {} as Record<string, number>,
      engagementByNews: [] as Array<{ newsId: string; newsTitle: string; views: number; comments: number; engagementRate: number }>,
      topNews: [] as Array<{ newsId: string; newsTitle: string; views: number }>
    }

    ;(instructorNews || []).forEach(news => {
      const metrics =
        news.metrics && typeof news.metrics === 'object'
          ? (news.metrics as { views?: number; comments?: number })
          : {}
      const views = metrics.views || 0
      const comments = metrics.comments || 0

      newsData.totalViews += views
      newsData.totalComments += comments

      const date = new Date(news.published_at || news.created_at).toISOString().split('T')[0]
      newsData.viewsByDate[date] = (newsData.viewsByDate[date] || 0) + views
      newsData.commentsByDate[date] = (newsData.commentsByDate[date] || 0) + comments

      const engagementRate = views > 0 ? (comments / views) * 100 : 0
      newsData.engagementByNews.push({
        newsId: news.id,
        newsTitle: news.title,
        views,
        comments,
        engagementRate
      })
    })

    // Top 5 noticias más vistas
    newsData.topNews = newsData.engagementByNews
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(n => ({ newsId: n.newsId, newsTitle: n.newsTitle, views: n.views }))

    const reelsData = {
      totalReels: instructorReels?.length || 0,
      activeReels: (instructorReels || []).filter(r => r.is_active).length,
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      viewsByDate: {} as Record<string, number>,
      likesByDate: {} as Record<string, number>,
      engagementByReel: [] as Array<{ reelId: string; reelTitle: string; views: number; likes: number; shares: number; comments: number; engagementRate: number }>,
      topReels: [] as Array<{ reelId: string; reelTitle: string; views: number }>
    }

    ;(instructorReels || []).forEach(reel => {
      reelsData.totalViews += reel.view_count || 0
      reelsData.totalLikes += reel.like_count || 0
      reelsData.totalShares += reel.share_count || 0
      reelsData.totalComments += reel.comment_count || 0

      const date = new Date(reel.published_at || reel.created_at).toISOString().split('T')[0]
      reelsData.viewsByDate[date] = (reelsData.viewsByDate[date] || 0) + (reel.view_count || 0)
      reelsData.likesByDate[date] = (reelsData.likesByDate[date] || 0) + (reel.like_count || 0)

      const engagementRate = (reel.view_count || 0) > 0 
        ? (((reel.like_count || 0) + (reel.share_count || 0) + (reel.comment_count || 0)) / (reel.view_count || 1)) * 100
        : 0

      reelsData.engagementByReel.push({
        reelId: reel.id,
        reelTitle: reel.title,
        views: reel.view_count || 0,
        likes: reel.like_count || 0,
        shares: reel.share_count || 0,
        comments: reel.comment_count || 0,
        engagementRate
      })
    })

    // Top 5 reels más vistos
    reelsData.topReels = reelsData.engagementByReel
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(r => ({ reelId: r.reelId, reelTitle: r.reelTitle, views: r.views }))

    // ========== PREPARAR RESPUESTA ==========
    
    const response = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      hr: {
        usersByCountry: Object.entries(usersByCountry).map(([country, count]) => ({ country, count })),
        registrationsByDate: Object.entries(registrationsByDate).map(([date, count]) => ({ date, count })),
        demographics
      },
      courses: coursesData,
      communities: communitiesData,
      news: newsData,
      reels: reelsData
    }

    logger.log('✅ Estadísticas detalladas obtenidas exitosamente')
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
      }
    })

  } catch (error) {
    logger.error('💥 Error obteniendo estadísticas detalladas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
