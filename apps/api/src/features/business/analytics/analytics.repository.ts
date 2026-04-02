import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

import type {
  AnalyticsCourseAssignmentRecord,
  AnalyticsCourseCertificateRecord,
  AnalyticsCourseEnrollmentRecord,
  AnalyticsDailyProgressRecord,
  AnalyticsLessonProgressRecord,
  AnalyticsOrganizationInfo,
  AnalyticsOrganizationNodeRecord,
  AnalyticsOrganizationUserRecord,
  AnalyticsSourceData,
  AnalyticsStudySessionRecord,
} from './analytics.types'

export interface BusinessAnalyticsRepository {
  findOrganization(orgId: string): Promise<AnalyticsOrganizationInfo | null>
  fetchAnalyticsSourceData(
    organization: AnalyticsOrganizationInfo,
  ): Promise<AnalyticsSourceData>
}

export class SupabaseBusinessAnalyticsRepository
  implements BusinessAnalyticsRepository
{
  private readonly client = getServiceClient()

  async findOrganization(orgId: string) {
    const { data, error } = await this.client
      .from('organizations')
      .select('id, name, slug')
      .eq('id', orgId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw new DatabaseError('Error al obtener la organizacion', error)
    }

    return data as AnalyticsOrganizationInfo | null
  }

  async fetchAnalyticsSourceData(organization: AnalyticsOrganizationInfo) {
    const { data: orgUsersData, error: orgUsersError } = await this.client
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
          last_login_at
        )
      `)
      .eq('organization_id', organization.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (orgUsersError) {
      throw new DatabaseError(
        'Error al obtener usuarios de la organizacion',
        orgUsersError,
      )
    }

    const orgUsers = (orgUsersData ?? []) as unknown as AnalyticsOrganizationUserRecord[]
    if (orgUsers.length === 0) {
      return {
        organization,
        orgUsers: [],
        assignments: [],
        enrollments: [],
        certificates: [],
        lessonProgress: [],
        dailyProgress: [],
        studySessions: [],
        nodes: [],
        activeSinceDate: buildActiveSinceDate(),
      } satisfies AnalyticsSourceData
    }

    const userIds = orgUsers.map((user) => user.user_id)
    const sixMonthsAgoIso = buildSixMonthsAgoIso()
    const activeSinceDate = buildActiveSinceDate()

    const [
      assignmentsResult,
      enrollmentsResult,
      certificatesResult,
      lessonProgressResult,
      dailyProgressResult,
      studySessionsResult,
      nodesResult,
    ] = await Promise.all([
      this.client
        .from('organization_course_assignments')
        .select(
          'id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at',
        )
        .eq('organization_id', organization.id)
        .in('user_id', userIds),
      this.client
        .from('user_course_enrollments')
        .select(
          'enrollment_id, user_id, course_id, overall_progress_percentage, enrollment_status, completed_at, started_at',
        )
        .in('user_id', userIds),
      this.client
        .from('user_course_certificates')
        .select('certificate_id, user_id, course_id, issued_at')
        .eq('organization_id', organization.id)
        .in('user_id', userIds),
      this.client
        .from('user_lesson_progress')
        .select(
          'progress_id, user_id, lesson_id, enrollment_id, time_spent_minutes, is_completed, completed_at, last_accessed_at, quiz_completed, quiz_passed',
        )
        .in('user_id', userIds),
      this.client
        .from('daily_progress')
        .select(
          'user_id, progress_date, had_activity, streak_count, study_minutes, sessions_completed, sessions_missed',
        )
        .in('user_id', userIds)
        .gte('progress_date', sixMonthsAgoIso.split('T')[0]),
      this.client
        .from('study_sessions')
        .select(
          'id, user_id, start_time, actual_duration_minutes, status, completed_at, session_type',
        )
        .in('user_id', userIds)
        .gte('start_time', sixMonthsAgoIso),
      this.client
        .from('organization_nodes')
        .select(
          'id, name, type, properties, organization_node_users(user_id)',
        )
        .eq('organization_id', organization.id)
        .eq('type', 'team'),
    ])

    if (assignmentsResult.error) {
      throw new DatabaseError(
        'Error al obtener asignaciones de cursos',
        assignmentsResult.error,
      )
    }
    if (enrollmentsResult.error) {
      throw new DatabaseError(
        'Error al obtener inscripciones de cursos',
        enrollmentsResult.error,
      )
    }
    if (certificatesResult.error) {
      throw new DatabaseError(
        'Error al obtener certificados',
        certificatesResult.error,
      )
    }
    if (lessonProgressResult.error) {
      throw new DatabaseError(
        'Error al obtener progreso de lecciones',
        lessonProgressResult.error,
      )
    }
    if (dailyProgressResult.error) {
      throw new DatabaseError(
        'Error al obtener progreso diario',
        dailyProgressResult.error,
      )
    }
    if (studySessionsResult.error) {
      throw new DatabaseError(
        'Error al obtener sesiones de estudio',
        studySessionsResult.error,
      )
    }
    if (nodesResult.error) {
      throw new DatabaseError(
        'Error al obtener equipos de la organizacion',
        nodesResult.error,
      )
    }

    return {
      organization,
      orgUsers,
      assignments:
        (assignmentsResult.data ?? []) as AnalyticsCourseAssignmentRecord[],
      enrollments:
        (enrollmentsResult.data ?? []) as AnalyticsCourseEnrollmentRecord[],
      certificates:
        (certificatesResult.data ?? []) as AnalyticsCourseCertificateRecord[],
      lessonProgress:
        (lessonProgressResult.data ?? []) as AnalyticsLessonProgressRecord[],
      dailyProgress:
        (dailyProgressResult.data ?? []) as AnalyticsDailyProgressRecord[],
      studySessions:
        (studySessionsResult.data ?? []) as AnalyticsStudySessionRecord[],
      nodes: (nodesResult.data ?? []) as unknown as AnalyticsOrganizationNodeRecord[],
      activeSinceDate,
    } satisfies AnalyticsSourceData
  }
}

function buildSixMonthsAgoIso() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return sixMonthsAgo.toISOString()
}

function buildActiveSinceDate() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return thirtyDaysAgo.toISOString().split('T')[0]
}
