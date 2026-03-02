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
 * 
 * TABLAS REALES utilizadas:
 * - organization_users → usuarios de la org
 * - organization_course_assignments → asignaciones B2B
 * - user_course_enrollments → progreso real de cursos
 * - user_course_certificates → certificados emitidos
 * - user_lesson_progress → tiempo por lección
 * - daily_progress → actividad diaria, streaks
 * - study_sessions → sesiones de estudio
 * - organization_nodes → equipos/nodos
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
    let supabase
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
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

    // =====================================================
    // PASO 1: Obtener usuarios activos de la organización
    // =====================================================
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

    const emptyResponse = {
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
      },
      engagement_metrics: {
        stickiness: [],
        frequency: [],
        streaks: [],
        heatmap: [],
        duration: []
      }
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json(emptyResponse)
    }

    const userIds = orgUsers.map(u => u.user_id)
    const totalUsers = orgUsers.length

    // =====================================================
    // PASO 2: Consultas paralelas a tablas REALES
    // =====================================================
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
      assignmentsResult,
      enrollmentsResult,
      certificatesResult,
      lessonProgressResult,
      dailyProgressResult,
      studySessionsResult,
      nodesResult,
      liaConversationsResult,
      liaMessagesResult,
      notesResult,
      coursesResult
    ] = await Promise.all([
      // 2a. Asignaciones de cursos B2B (organization_course_assignments)
      supabase
        .from('organization_course_assignments')
        .select('id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at')
        .eq('organization_id', organizationId)
        .in('user_id', userIds),

      // 2b. Enrollments reales (user_course_enrollments) para progreso
      supabase
        .from('user_course_enrollments')
        .select('enrollment_id, user_id, course_id, overall_progress_percentage, enrollment_status, completed_at, started_at')
        .in('user_id', userIds),

      // 2c. Certificados (user_course_certificates) con filtro de organización
      supabase
        .from('user_course_certificates')
        .select('certificate_id, user_id, course_id, issued_at')
        .eq('organization_id', organizationId),

      // 2d. Progreso por lección (user_lesson_progress) para tiempo real + quiz
      supabase
        .from('user_lesson_progress')
        .select('user_id, lesson_id, enrollment_id, time_spent_minutes, is_completed, completed_at, last_accessed_at, quiz_completed, quiz_passed')
        .in('user_id', userIds),

      // 2e. Actividad diaria (daily_progress) — últimos 6 meses para engagement
      supabase
        .from('daily_progress')
        .select('user_id, progress_date, had_activity, streak_count, study_minutes, sessions_completed, sessions_missed')
        .in('user_id', userIds)
        .gte('progress_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('progress_date', { ascending: false }),

      // 2f. Sesiones de estudio (study_sessions) — para engagement heatmap y duración
      supabase
        .from('study_sessions')
        .select('id, user_id, start_time, actual_duration_minutes, status, completed_at, session_type')
        .in('user_id', userIds)
        .gte('start_time', sixMonthsAgo.toISOString()),

      // 2g. Equipos/Nodos de la organización
      supabase
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
        .eq('type', 'team'),

      // 2h. Conversaciones LIA
      supabase
        .from('lia_conversations')
        .select('id, user_id, context_type, created_at')
        .in('user_id', userIds),

      // 2i. Mensajes LIA
      supabase
        .from('lia_messages')
        .select('id, conversation_id, role, user_id')
        .in('user_id', userIds),

      // 2j. Notas de lecciones
      supabase
        .from('user_lesson_notes')
        .select('id, user_id')
        .in('user_id', userIds),

      // 2k. Nombres de cursos (para breakdown)
      supabase
        .from('courses')
        .select('id, title')
    ])

    const assignments = assignmentsResult.data || []
    const enrollments = enrollmentsResult.data || []
    const certificates = certificatesResult.data || []
    const lessonProgress = lessonProgressResult.data || []
    const dailyProgress = dailyProgressResult.data || []
    const studySessions = studySessionsResult.data || []
    const nodes = nodesResult.data || []
    const liaConversations = liaConversationsResult.data || []
    const liaMessages = liaMessagesResult.data || []
    const userNotes = notesResult.data || []
    const allCourses = coursesResult.data || []

    // Mapa de courseId -> título
    const courseNameMap = new Map<string, string>()
    allCourses.forEach((c: any) => courseNameMap.set(c.id, c.title))

    // Log errors but don't fail
    if (assignmentsResult.error) logger.error('❌ Error fetching assignments:', assignmentsResult.error)
    if (enrollmentsResult.error) logger.error('❌ Error fetching enrollments:', enrollmentsResult.error)
    if (certificatesResult.error) logger.error('❌ Error fetching certificates:', certificatesResult.error)
    if (lessonProgressResult.error) logger.error('❌ Error fetching lesson progress:', lessonProgressResult.error)
    if (dailyProgressResult.error) logger.error('❌ Error fetching daily progress:', dailyProgressResult.error)
    if (studySessionsResult.error) logger.error('❌ Error fetching study sessions:', studySessionsResult.error)
    if (liaConversationsResult.error) logger.error('❌ Error fetching LIA conversations:', liaConversationsResult.error)
    if (liaMessagesResult.error) logger.error('❌ Error fetching LIA messages:', liaMessagesResult.error)
    if (notesResult.error) logger.error('❌ Error fetching notes:', notesResult.error)

    // =====================================================
    // PASO 3: Calcular métricas generales (FASE 1)
    // =====================================================

    // Crear mapa de enrollments por (user_id, course_id) para cruzar con assignments
    const enrollmentMap = new Map<string, any>()
    enrollments.forEach(e => {
      enrollmentMap.set(`${e.user_id}_${e.course_id}`, e)
    })

    // Calcular progreso real por assignment usando enrollment data
    const totalAssignments = assignments.length
    const completedCourses = assignments.filter(a => {
      const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
      return a.status === 'completed' ||
             enrollment?.enrollment_status === 'completed' ||
             (enrollment?.overall_progress_percentage ?? 0) >= 100
    }).length

    // Progreso promedio real
    let totalProgress = 0
    let progressCount = 0
    assignments.forEach(a => {
      const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
      const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
      totalProgress += Number(progress)
      progressCount++
    })
    const avgProgress = progressCount > 0 ? totalProgress / progressCount : 0

    // Tiempo total real (de lesson progress)
    const totalTimeMinutes = lessonProgress.reduce((sum, lp) => sum + (lp.time_spent_minutes || 0), 0)

    // Certificados totales
    const totalCertificates = certificates.length

    // Usuarios activos (últimos 30 días basado en daily_progress)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const activeUserIds = new Set(
      dailyProgress
        .filter(dp => dp.had_activity && dp.progress_date >= thirtyDaysAgoStr)
        .map(dp => dp.user_id)
    )
    const activeUsers = activeUserIds.size

    // Tasa de retención
    const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

    // =====================================================
    // PASO 4: Per-user analytics (FASE 1 + FASE 3)
    // =====================================================
    const userAnalytics = orgUsers.map(u => {
      const userId = u.user_id
      const userAssignments = assignments.filter(a => a.user_id === userId)
      const userLessonProgress = lessonProgress.filter(lp => lp.user_id === userId)
      const userCerts = certificates.filter(c => c.user_id === userId)
      const userDailyProgress = dailyProgress.filter(dp => dp.user_id === userId)
      const userSessions = studySessions.filter(s => s.user_id === userId)

      // Progreso promedio del usuario
      let userTotalProgress = 0
      let userProgressCount = 0
      userAssignments.forEach(a => {
        const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
        const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
        userTotalProgress += Number(progress)
        userProgressCount++
      })
      const userAvgProgress = userProgressCount > 0 ? Math.round((userTotalProgress / userProgressCount) * 100) / 100 : 0

      // Tiempo total en minutos
      const userTotalTimeMinutes = userLessonProgress.reduce((sum, lp) => sum + (lp.time_spent_minutes || 0), 0)

      // Cursos completados
      const userCoursesCompleted = userAssignments.filter(a => {
        const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
        return a.status === 'completed' ||
               enrollment?.enrollment_status === 'completed' ||
               (enrollment?.overall_progress_percentage ?? 0) >= 100
      }).length

      // Streak actual (último registro de daily_progress)
      const latestDailyProgress = userDailyProgress.length > 0 ? userDailyProgress[0] : null
      const currentStreak = latestDailyProgress?.streak_count || 0

      // Adherencia al planificador (sesiones completadas vs total)
      const totalSessions = userSessions.length
      const completedSessions = userSessions.filter(s => s.status === 'completed').length
      const adherence = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      // Calendario de actividad (últimos 6 meses)
      const activityCalendar = userDailyProgress.map(dp => ({
        date: dp.progress_date,
        count: dp.study_minutes || 0,
        level: !dp.had_activity ? 0 :
               (dp.study_minutes || 0) <= 15 ? 1 :
               (dp.study_minutes || 0) <= 45 ? 2 :
               (dp.study_minutes || 0) <= 90 ? 3 : 4
      }))

      // Última actividad
      const lastActivity = userDailyProgress.length > 0 ? userDailyProgress[0].progress_date :
                           (u.users as any)?.last_login_at || null

      return {
        user_id: userId,
        display_name: (u.users as any)?.display_name || (u.users as any)?.first_name || (u.users as any)?.email?.split('@')[0] || 'Usuario',
        name: ((u.users as any)?.first_name && (u.users as any)?.last_name)
          ? `${(u.users as any).first_name} ${(u.users as any).last_name}`.trim()
          : null,
        first_name: (u.users as any)?.first_name || null,
        last_name: (u.users as any)?.last_name || null,
        email: (u.users as any)?.email || '',
        username: (u.users as any)?.username || '',
        role: u.job_title || u.role || 'member',
        profile_picture_url: (u.users as any)?.profile_picture_url || null,
        courses_assigned: userAssignments.length,
        courses_completed: userCoursesCompleted,
        average_progress: userAvgProgress,
        total_time_hours: Math.round(userTotalTimeMinutes / 60 * 100) / 100,
        total_time_minutes: userTotalTimeMinutes,
        certificates_count: userCerts.length,
        last_login_at: (u.users as any)?.last_login_at || null,
        last_active: lastActivity,
        joined_at: u.joined_at,
        // FASE 3: Stats detallados para UserDetailModal
        stats: {
          current_streak: currentStreak,
          planner: {
            adherence: adherence,
            total_sessions: totalSessions,
            completed_sessions: completedSessions,
            completed: completedSessions,
            pending: totalSessions - completedSessions
          },
          activity_calendar: activityCalendar,
          hourly_distribution: (() => {
            const hours = new Array(24).fill(0)
            userSessions.forEach(s => {
              if (s.start_time) {
                const h = new Date(s.start_time).getHours()
                hours[h]++
              }
            })
            return hours
          })(),
          // Course progress stats
          courses: {
            total_lesson_time_minutes: userTotalTimeMinutes,
            lessons_completed: userLessonProgress.filter(lp => lp.is_completed).length,
            quizzes_completed: userLessonProgress.filter(lp => lp.quiz_completed).length,
            quizzes_passed: userLessonProgress.filter(lp => lp.quiz_passed).length,
            notes_count: userNotes.filter(n => n.user_id === userId).length,
            breakdown: userAssignments.map(a => {
              const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
              const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
              const isCompleted = a.status === 'completed' ||
                enrollment?.enrollment_status === 'completed' ||
                Number(progress) >= 100
              return {
                course_id: a.course_id,
                course_title: courseNameMap.get(a.course_id) || 'Curso sin título',
                progress: Number(progress),
                status: isCompleted ? 'completed' : Number(progress) > 0 ? 'active' : 'enrolled'
              }
            })
          },
          // LIA interaction stats
          lia: (() => {
            const userConvos = liaConversations.filter(c => c.user_id === userId)
            const userMsgs = liaMessages.filter(m => m.user_id === userId)
            const userMessages = userMsgs.filter(m => m.role === 'user')
            const assistantMessages = userMsgs.filter(m => m.role === 'assistant')
            const aiChatConvos = userConvos.filter(c => c.context_type === 'ai_chat' || !c.context_type).length
            const courseConvos = userConvos.filter(c => c.context_type === 'course').length
            return {
              total_conversations: userConvos.length,
              total_messages: userMsgs.length,
              user_messages: userMessages.length,
              assistant_responses: assistantMessages.length,
              contexts: {
                ai_chat: aiChatConvos,
                course: courseConvos
              }
            }
          })()
        }
      }
    })

    // =====================================================
    // PASO 5: Engagement metrics (FASE 2)
    // =====================================================

    // 5a. Stickiness (DAU/MAU by week)
    const stickinessData = calculateStickiness(dailyProgress, totalUsers)

    // 5b. Frequency distribution
    const frequencyData = calculateFrequency(dailyProgress, thirtyDaysAgoStr)

    // 5c. Streaks distribution
    const streaksData = calculateStreaks(dailyProgress, userIds)

    // 5d. Heatmap (day × hour)
    const heatmapData = calculateHeatmap(studySessions)

    // 5e. Duration by role
    const durationData = calculateDuration(studySessions, orgUsers)

    // =====================================================
    // PASO 6: Team analytics
    // =====================================================
    const teamAnalytics = (nodes || []).map((node: any) => {
      const memberIds = node.organization_node_users?.map((m: any) => m.user_id) || []
      const teamAssignments = assignments.filter(a => memberIds.includes(a.user_id))
      const teamLessonProgress = lessonProgress.filter(lp => memberIds.includes(lp.user_id))

      let teamTotalProgress = 0
      let teamProgressCount = 0
      teamAssignments.forEach(a => {
        const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
        const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
        teamTotalProgress += Number(progress)
        teamProgressCount++
      })

      const teamCompleted = teamAssignments.filter(a => {
        const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
        return a.status === 'completed' || enrollment?.enrollment_status === 'completed'
      }).length

      const props = node.properties || {}

      return {
        team_id: node.id,
        name: node.name,
        description: props.description || null,
        image_url: props.image_url || null,
        member_count: memberIds.length,
        stats: {
          average_progress: teamProgressCount > 0
            ? Math.round((teamTotalProgress / teamProgressCount) * 100) / 100
            : 0,
          courses_completed: teamCompleted,
          total_enrollments: teamAssignments.length,
          total_time_hours: Math.round(teamLessonProgress.reduce((sum, lp) => sum + (lp.time_spent_minutes || 0), 0) / 60 * 100) / 100,
          lia_conversations: 0
        }
      }
    })

    // =====================================================
    // PASO 7: Course distribution
    // =====================================================
    const inProgressCount = assignments.filter(a => {
      const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
      const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
      return Number(progress) > 0 && Number(progress) < 100 && a.status !== 'completed'
    }).length

    const notStartedCount = assignments.filter(a => {
      const enrollment = enrollmentMap.get(`${a.user_id}_${a.course_id}`)
      const progress = enrollment?.overall_progress_percentage ?? a.completion_percentage ?? 0
      return Number(progress) === 0 && a.status !== 'completed'
    }).length

    // =====================================================
    // RESPUESTA FINAL
    // =====================================================
    return NextResponse.json({
      success: true,
      general_metrics: {
        total_users: totalUsers,
        total_courses_assigned: totalAssignments,
        completed_courses: completedCourses,
        average_progress: Math.round(avgProgress * 100) / 100,
        total_time_hours: Math.round(totalTimeMinutes / 60 * 100) / 100,
        total_certificates: totalCertificates,
        active_users: activeUsers,
        retention_rate: retentionRate
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
          { status: 'in_progress', count: inProgressCount },
          { status: 'not_started', count: notStartedCount }
        ],
        top_by_time: []
      },
      teams: {
        total_teams: nodes?.length || 0,
        teams: teamAnalytics,
        ranking: [...teamAnalytics].sort((a: any, b: any) => b.stats.average_progress - a.stats.average_progress)
      },
      engagement_metrics: {
        stickiness: stickinessData,
        frequency: frequencyData,
        streaks: streaksData,
        heatmap: heatmapData,
        duration: durationData
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

// =====================================================
// HELPER FUNCTIONS - Engagement Metrics
// =====================================================

/**
 * Calcula DAU/MAU stickiness por semana (últimas 12 semanas)
 */
function calculateStickiness(dailyProgress: any[], totalUsers: number): any[] {
  if (dailyProgress.length === 0) return []

  const weeks: { [key: string]: Set<string> } = {}
  const monthUsers: Set<string> = new Set()

  dailyProgress.forEach(dp => {
    if (!dp.had_activity) return
    monthUsers.add(dp.user_id)

    const date = new Date(dp.progress_date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeks[weekKey]) weeks[weekKey] = new Set()
    weeks[weekKey].add(dp.user_id)
  })

  const mau = monthUsers.size

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, users]) => {
      const dau = users.size
      return {
        name: new Date(week).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        dau,
        mau,
        ratio: mau > 0 ? Math.round((dau / mau) * 100) : 0
      }
    })
}

/**
 * Calcula distribución de frecuencia de acceso (últimos 30 días)
 */
function calculateFrequency(dailyProgress: any[], thirtyDaysAgoStr: string): any[] {
  // Contar días activos por usuario en últimos 30 días
  const userDayCount: { [userId: string]: number } = {}

  dailyProgress.forEach(dp => {
    if (!dp.had_activity || dp.progress_date < thirtyDaysAgoStr) return
    userDayCount[dp.user_id] = (userDayCount[dp.user_id] || 0) + 1
  })

  // Agrupar en rangos
  const ranges = [
    { name: '1-2 días', min: 1, max: 2 },
    { name: '3-5 días', min: 3, max: 5 },
    { name: '6-10 días', min: 6, max: 10 },
    { name: '11-20 días', min: 11, max: 20 },
    { name: '21+ días', min: 21, max: Infinity },
  ]

  return ranges.map(range => ({
    name: range.name,
    users: Object.values(userDayCount).filter(count => count >= range.min && count <= range.max).length
  })).filter(r => r.users > 0)
}

/**
 * Calcula distribución de streaks
 */
function calculateStreaks(dailyProgress: any[], userIds: string[]): any[] {
  // Obtener último streak de cada usuario
  const userStreaks: { [userId: string]: number } = {}
  userIds.forEach(id => { userStreaks[id] = 0 })

  dailyProgress.forEach(dp => {
    if (!userStreaks.hasOwnProperty(dp.user_id)) return
    // Tomamos el primer registro (más reciente) gracias al ORDER BY desc
    if (userStreaks[dp.user_id] === 0 && dp.streak_count > 0) {
      userStreaks[dp.user_id] = dp.streak_count
    }
  })

  const streakValues = Object.values(userStreaks)
  const total = streakValues.length || 1

  const noStreak = streakValues.filter(s => s === 0).length
  const short = streakValues.filter(s => s >= 1 && s <= 3).length
  const medium = streakValues.filter(s => s >= 4 && s <= 7).length
  const long = streakValues.filter(s => s > 7).length

  return [
    { name: 'Sin racha', value: Math.round((noStreak / total) * 100), fill: '#EF4444' },
    { name: '1-3 días', value: Math.round((short / total) * 100), fill: '#F59E0B' },
    { name: '4-7 días', value: Math.round((medium / total) * 100), fill: '#3B82F6' },
    { name: '7+ días', value: Math.round((long / total) * 100), fill: '#10B981' },
  ]
}

/**
 * Calcula heatmap de actividad (día × hora)
 */
function calculateHeatmap(studySessions: any[]): any[] {
  if (studySessions.length === 0) return []

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const hourRanges = ['6-9', '9-12', '12-15', '15-18', '18-21', '21-24']

  const matrix: { [key: string]: number } = {}

  studySessions.forEach(session => {
    if (!session.start_time) return
    const date = new Date(session.start_time)
    const day = days[date.getDay()]
    const hour = date.getHours()

    let hourRange = '6-9'
    if (hour >= 21) hourRange = '21-24'
    else if (hour >= 18) hourRange = '18-21'
    else if (hour >= 15) hourRange = '15-18'
    else if (hour >= 12) hourRange = '12-15'
    else if (hour >= 9) hourRange = '9-12'

    const key = `${day}_${hourRange}`
    matrix[key] = (matrix[key] || 0) + 1
  })

  return Object.entries(matrix).map(([key, value]) => {
    const [day, hour] = key.split('_')
    return { day, hour, value }
  })
}

/**
 * Calcula duración promedio y máxima de sesiones por rol
 */
function calculateDuration(studySessions: any[], orgUsers: any[]): any[] {
  if (studySessions.length === 0) return []

  // Mapear userId a job_title
  const userRoles: { [userId: string]: string } = {}
  orgUsers.forEach(u => {
    userRoles[u.user_id] = u.job_title || u.role || 'member'
  })

  // Agrupar duración por rol
  const roleDurations: { [role: string]: number[] } = {}

  studySessions.forEach(session => {
    if (!session.actual_duration_minutes || session.actual_duration_minutes <= 0) return
    const role = userRoles[session.user_id] || 'member'
    if (!roleDurations[role]) roleDurations[role] = []
    roleDurations[role].push(session.actual_duration_minutes)
  })

  return Object.entries(roleDurations).map(([role, durations]) => {
    const sorted = durations.sort((a, b) => a - b)
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0
    const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0

    return {
      role,
      median: Math.round(median),
      max: Math.round(max),
      count: durations.length
    }
  })
}
