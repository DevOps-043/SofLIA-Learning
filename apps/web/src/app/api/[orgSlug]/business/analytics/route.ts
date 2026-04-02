import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  buildBusinessAnalyticsResponse,
  getEmptyBusinessAnalyticsResponse,
  getRelevantAnalyticsCourseIds,
} from '../../../../../features/business-panel/services/analytics/analytics-response.service'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/analytics
 * Obtiene analytics para la organizacion especifica.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug de organización requerido',
        },
        { status: 400 },
      )
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    let supabase
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = createAdminClient()
      } else {
        throw new Error('Service Role Key missing')
      }
    } catch (error) {
      logger.warn(
        'Analytics: usando cliente estandar (posible limitacion por RLS)',
        error,
      )
      supabase = await createClient()
    }

    const organizationId = auth.organizationId

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
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener usuarios de la organización',
        },
        { status: 500 },
      )
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json(getEmptyBusinessAnalyticsResponse())
    }

    const userIds = orgUsers.map((user) => user.user_id)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

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
    ] = await Promise.all([
      supabase
        .from('organization_course_assignments')
        .select(
          'id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at',
        )
        .eq('organization_id', organizationId)
        .in('user_id', userIds),

      supabase
        .from('user_course_enrollments')
        .select(
          'enrollment_id, user_id, course_id, overall_progress_percentage, enrollment_status, completed_at, started_at',
        )
        .in('user_id', userIds),

      supabase
        .from('user_course_certificates')
        .select('certificate_id, user_id, course_id, issued_at')
        .eq('organization_id', organizationId)
        .in('user_id', userIds),

      supabase
        .from('user_lesson_progress')
        .select(
          'user_id, lesson_id, enrollment_id, time_spent_minutes, is_completed, completed_at, last_accessed_at, quiz_completed, quiz_passed',
        )
        .in('user_id', userIds),

      supabase
        .from('daily_progress')
        .select(
          'user_id, progress_date, had_activity, streak_count, study_minutes, sessions_completed, sessions_missed',
        )
        .in('user_id', userIds)
        .gte('progress_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('progress_date', { ascending: false }),

      supabase
        .from('study_sessions')
        .select(
          'id, user_id, start_time, actual_duration_minutes, status, completed_at, session_type',
        )
        .in('user_id', userIds)
        .gte('start_time', sixMonthsAgo.toISOString()),

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

      supabase
        .from('lia_conversations')
        .select('id, user_id, context_type, created_at')
        .in('user_id', userIds),

      supabase
        .from('lia_messages')
        .select('id, conversation_id, role, user_id')
        .in('user_id', userIds),

      supabase
        .from('user_lesson_notes')
        .select('id, user_id')
        .in('user_id', userIds),
    ])

    if (assignmentsResult.error) logger.error('Error fetching assignments:', assignmentsResult.error)
    if (enrollmentsResult.error) logger.error('Error fetching enrollments:', enrollmentsResult.error)
    if (certificatesResult.error) logger.error('Error fetching certificates:', certificatesResult.error)
    if (lessonProgressResult.error) logger.error('Error fetching lesson progress:', lessonProgressResult.error)
    if (dailyProgressResult.error) logger.error('Error fetching daily progress:', dailyProgressResult.error)
    if (studySessionsResult.error) logger.error('Error fetching study sessions:', studySessionsResult.error)
    if (nodesResult.error) logger.error('Error fetching organization nodes:', nodesResult.error)
    if (liaConversationsResult.error) logger.error('Error fetching LIA conversations:', liaConversationsResult.error)
    if (liaMessagesResult.error) logger.error('Error fetching LIA messages:', liaMessagesResult.error)
    if (notesResult.error) logger.error('Error fetching notes:', notesResult.error)

    const assignments = assignmentsResult.data || []
    const enrollments = enrollmentsResult.data || []
    const relevantCourseIds = getRelevantAnalyticsCourseIds({
      assignments,
      enrollments,
    })

    let courses: Array<{ id: string; title: string | null }> = []
    if (relevantCourseIds.length > 0) {
      const coursesResult = await supabase
        .from('courses')
        .select('id, title')
        .in('id', relevantCourseIds)

      if (coursesResult.error) {
        logger.error('Error fetching course titles:', coursesResult.error)
      } else {
        courses = coursesResult.data || []
      }
    }

    return NextResponse.json(
      buildBusinessAnalyticsResponse({
        orgUsers,
        assignments,
        enrollments,
        certificates: certificatesResult.data || [],
        lessonProgress: lessonProgressResult.data || [],
        dailyProgress: dailyProgressResult.data || [],
        studySessions: studySessionsResult.data || [],
        nodes: nodesResult.data || [],
        liaConversations: liaConversationsResult.data || [],
        liaMessages: liaMessagesResult.data || [],
        userNotes: notesResult.data || [],
        courses,
        thirtyDaysAgoStr,
      }),
    )
  } catch (error) {
    logger.error('Error in GET /api/[orgSlug]/business/analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos de analytics',
      },
      { status: 500 },
    )
  }
}
