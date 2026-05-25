import { DatabaseError } from '@/core/errors/app-error'
import type { getServiceClient } from '@/core/supabase/service-client'

import { buildActiveSinceDate, buildSixMonthsAgoIso } from './analytics.repository.dates'
import { buildEmptyAnalyticsSourceData } from './analytics.repository.empty'
import {
  fetchAnalyticsQueryResults,
  fetchOrganizationUsers,
} from './analytics.repository.queries'
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

type AnalyticsClient = ReturnType<typeof getServiceClient>
type QueryResult = { data: unknown; error: unknown | null }

function assertQuerySuccess(result: QueryResult, message: string) {
  if (result.error) {
    throw new DatabaseError(message, result.error)
  }
}

export async function fetchAnalyticsSourceData(
  client: AnalyticsClient,
  organization: AnalyticsOrganizationInfo,
): Promise<AnalyticsSourceData> {
  const orgUsersResult = await fetchOrganizationUsers(client, organization.id)
  assertQuerySuccess(
    orgUsersResult,
    'Error al obtener usuarios de la organizacion',
  )

  const orgUsers =
    (orgUsersResult.data ?? []) as unknown as AnalyticsOrganizationUserRecord[]

  if (orgUsers.length === 0) {
    return buildEmptyAnalyticsSourceData(organization)
  }

  const sixMonthsAgoIso = buildSixMonthsAgoIso()
  const results = await fetchAnalyticsQueryResults(
    client,
    organization.id,
    orgUsers.map((user) => user.user_id),
    sixMonthsAgoIso,
  )

  assertQuerySuccess(results.assignments, 'Error al obtener asignaciones de cursos')
  assertQuerySuccess(results.enrollments, 'Error al obtener inscripciones de cursos')
  assertQuerySuccess(results.certificates, 'Error al obtener certificados')
  assertQuerySuccess(results.lessonProgress, 'Error al obtener progreso de lecciones')
  assertQuerySuccess(results.dailyProgress, 'Error al obtener progreso diario')
  assertQuerySuccess(results.studySessions, 'Error al obtener sesiones de estudio')
  assertQuerySuccess(results.nodes, 'Error al obtener equipos de la organizacion')

  return {
    organization,
    orgUsers,
    assignments: (results.assignments.data ?? []) as AnalyticsCourseAssignmentRecord[],
    enrollments: (results.enrollments.data ?? []) as AnalyticsCourseEnrollmentRecord[],
    certificates: (results.certificates.data ?? []) as AnalyticsCourseCertificateRecord[],
    lessonProgress: (results.lessonProgress.data ?? []) as AnalyticsLessonProgressRecord[],
    dailyProgress: (results.dailyProgress.data ?? []) as AnalyticsDailyProgressRecord[],
    studySessions: (results.studySessions.data ?? []) as AnalyticsStudySessionRecord[],
    nodes: (results.nodes.data ?? []) as unknown as AnalyticsOrganizationNodeRecord[],
    activeSinceDate: buildActiveSinceDate(),
  }
}
