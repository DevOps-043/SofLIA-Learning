import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/analytics
 * Obtiene datos de analytics para la organización especificada.
 *
 * IMPORTANTE: Esta API usa el orgSlug de la URL para asegurar
 * que se devuelvan los datos de la organización correcta.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido'
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    // Inicializar cliente de Supabase
    // PREFERENCIA: Usar Service Role (Admin) para ignorar RLS y ver todos los datos de la org
    let supabase
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // Verificar si existe la key antes de intentar crear el cliente para evitar excepciones
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = createAdminClient()
      } else {
        throw new Error('Service Role Key missing')
      }
    } catch (e) {
      logger.warn('⚠️ Analytics: Usando cliente estándar (posible limitación por RLS)', e)
      supabase = await createClient()
    }

    const organizationId = auth.organizationId

    // 1. Obtener usuarios activos de la organización
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select(`
        user_id,
        role,
        status,
        joined_at,
        job_title,
        users!organization_users_user_id_fkey (
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          profile_picture_url,
          last_login_at,
          updated_at,
          created_at,
          cargo_rol
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (orgUsersError) {
      logger.error('Error fetching organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios de la organización'
      }, { status: 500 })
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json({
        success: true,
        general_metrics: {
          total_users: 0,
          total_courses_assigned: 0,
          completed_courses: 0,
          average_progress: 0,
          total_time_hours: 0,
          total_certificates: 0,
          active_users: 0,
          retention_rate: 0
        },
        user_analytics: [],
        trends: {
          enrollments_by_month: [],
          completions_by_month: [],
          time_by_month: [],
          active_users_by_month: []
        },
        by_role: {
          distribution: [],
          progress_comparison: [],
          completions: [],
          time_spent: []
        },
        course_metrics: {
          distribution: [],
          top_by_time: []
        },
        teams: {
          total_teams: 0,
          teams: [],
          ranking: []
        }
      })
    }

    const userIds = orgUsers.map(u => u.user_id)

    // 2. Obtener enrollments de estos usuarios
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('id, user_id, course_id, status, progress_percentage, enrolled_at, completed_at, last_accessed_at')
      .in('user_id', userIds)

    // 3. Obtener learning time
    const { data: learningTime } = await supabase
      .from('learning_time')
      .select('user_id, total_minutes, course_id, updated_at')
      .in('user_id', userIds)

    // 4. Obtener certificados
    const { data: certificates } = await supabase
      .from('course_certificates')
      .select('id, user_id, course_id, issued_at')
      .in('user_id', userIds)

    // 5. Obtener equipos de la organización (Nueva estructura: Nodos)
    // Se buscan nodos de tipo 'team' (o que se comporten como equipos)
    const { data: nodes } = await supabase
      .from('organization_nodes')
      .select(`
        id,
        name,
        type,
        properties,
        organization_node_users (
          user_id
        )
      `)
      .eq('organization_id', organizationId)
      .eq('type', 'team') // Filtrar solo los nodos que son equipos

    // Calcular métricas generales
    const totalUsers = orgUsers.length
    const totalEnrollments = enrollments?.length || 0
    const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0
    const totalProgress = enrollments?.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) || 0
    const avgProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0
    const totalTimeMinutes = learningTime?.reduce((sum, lt) => sum + (lt.total_minutes || 0), 0) || 0
    const totalCertificates = certificates?.length || 0

    // Usuarios activos (con actividad en los últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = orgUsers.filter(u => {
      const lastLogin = u.users?.last_login_at || u.users?.updated_at
      return lastLogin && new Date(lastLogin) > thirtyDaysAgo
    }).length

    // User analytics
    const userAnalytics = orgUsers.map(u => {
      const userEnrollments = enrollments?.filter(e => e.user_id === u.user_id) || []
      const userTime = learningTime?.filter(lt => lt.user_id === u.user_id) || []
      const userCerts = certificates?.filter(c => c.user_id === u.user_id) || []

      return {
        user_id: u.user_id,
        display_name: u.users?.display_name || u.users?.first_name || u.users?.email?.split('@')[0] || 'Usuario',
        email: u.users?.email || '',
        username: u.users?.username || '',
        role: u.job_title || u.role || 'member',
        profile_picture_url: u.users?.profile_picture_url || null,
        courses_assigned: userEnrollments.length,
        courses_completed: userEnrollments.filter(e => e.status === 'completed').length,
        average_progress: userEnrollments.length > 0
          ? userEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / userEnrollments.length
          : 0,
        total_time_hours: userTime.reduce((sum, lt) => sum + (lt.total_minutes || 0), 0) / 60,
        certificates_count: userCerts.length,
        last_login_at: u.users?.last_login_at || null,
        joined_at: u.joined_at
      }
    })

    // Team analytics (Basado en Nodos)
    const teamAnalytics = nodes?.map(node => {
      // Obtener IDs de usuarios asignados a este nodo
      const memberIds = node.organization_node_users?.map((m: any) => m.user_id) || []

      // Filtrar enrollments y tiempo para estos miembros
      const teamEnrollments = enrollments?.filter(e => memberIds.includes(e.user_id)) || []
      const teamTime = learningTime?.filter(lt => memberIds.includes(lt.user_id)) || []

      // Extraer propiedades del JSONB
      // @ts-ignore
      const props = node.properties || {}

      return {
        team_id: node.id,
        name: node.name,
        description: props.description || null,
        image_url: props.image_url || null,
        member_count: memberIds.length,
        stats: {
          average_progress: teamEnrollments.length > 0
            ? teamEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / teamEnrollments.length
            : 0,
          courses_completed: teamEnrollments.filter(e => e.status === 'completed').length,
          total_enrollments: teamEnrollments.length,
          total_time_hours: teamTime.reduce((sum, lt) => sum + (lt.total_minutes || 0), 0) / 60,
          lia_conversations: 0 // TODO: Implementar conteo de conversaciones por nodo si es necesario
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      general_metrics: {
        total_users: totalUsers,
        total_courses_assigned: totalEnrollments,
        completed_courses: completedCourses,
        average_progress: Math.round(avgProgress * 100) / 100,
        total_time_hours: Math.round(totalTimeMinutes / 60 * 100) / 100,
        total_certificates: totalCertificates,
        active_users: activeUsers,
        retention_rate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      user_analytics: userAnalytics,
      trends: {
        enrollments_by_month: [],
        completions_by_month: [],
        time_by_month: [],
        active_users_by_month: []
      },
      by_role: {
        distribution: [],
        progress_comparison: [],
        completions: [],
        time_spent: []
      },
      course_metrics: {
        distribution: [
          { status: 'completed', count: completedCourses },
          { status: 'in_progress', count: enrollments?.filter(e => e.status === 'in_progress').length || 0 },
          { status: 'not_started', count: enrollments?.filter(e => e.status === 'not_started').length || 0 }
        ],
        top_by_time: []
      },
      teams: {
        total_teams: nodes?.length || 0,
        teams: teamAnalytics,
        ranking: teamAnalytics.sort((a: any, b: any) => b.stats.average_progress - a.stats.average_progress)
      }
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/[orgSlug]/business/analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de analytics'
    }, { status: 500 })
  }
}
