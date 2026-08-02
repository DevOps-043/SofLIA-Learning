import { fetchActivityEvaluations } from './fetch-activity-evaluations'
import { fetchActivityCompletionRecords } from './fetch-activity-completion-records'
import { fetchActivitySubmissionRecords } from './fetch-activity-submission-records'
import { fetchActiveOrganizationHierarchy } from './fetch-active-organization-hierarchy'
import { fetchAssignmentRecords } from './fetch-assignment-records'
import { fetchEnrollmentRecords } from './fetch-enrollment-records'
import { fetchLessonNoteRecords } from './fetch-lesson-note-records'
import { fetchLessonProgressRecords } from './fetch-lesson-progress-records'
import { fetchLiaMessages } from './fetch-lia-messages'
import { fetchLiaConversationRecords } from './fetch-lia-conversation-records'
import { fetchOrganizationRegions } from './fetch-organization-regions'
import { fetchOrganizationTeams } from './fetch-organization-teams'
import { fetchOrganizationUsers } from './fetch-organization-users'
import { fetchOrganizationZones } from './fetch-organization-zones'
import { fetchQuizSubmissionRecords } from './fetch-quiz-submission-records'
import { mapActiveHierarchyToAnalytics } from './map-active-hierarchy-to-analytics'
import { uniqueValues } from './unique-values'
import type { AnalyticsHierarchyData } from './active-organization-hierarchy'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'
import type { ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'

export async function fetchReportsAnalyticsQueryData(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
  filters: ReportsAnalyticsFilters,
): Promise<AnalyticsQueryData> {
  const hierarchySupabase = supabase as unknown as ReportsAnalyticsUntypedSupabaseClient
  const [organizationUsers, activeHierarchy] = await Promise.all([
    fetchOrganizationUsers(supabase, organizationId),
    fetchActiveOrganizationHierarchy(hierarchySupabase, organizationId),
  ])
  const organizationUserIds = uniqueValues(organizationUsers.map((record) => record.user_id))
  const dateRange = { from: filters.from, to: filters.to }
  const hierarchyDataPromise: Promise<AnalyticsHierarchyData> = activeHierarchy
    ? Promise.resolve(mapActiveHierarchyToAnalytics(organizationUsers, activeHierarchy))
    : Promise.all([
        fetchOrganizationRegions(hierarchySupabase, organizationId),
        fetchOrganizationZones(hierarchySupabase, organizationId),
        fetchOrganizationTeams(hierarchySupabase, organizationId),
      ]).then(([regions, zones, teams]) => ({ organizationUsers, regions, zones, teams }))

  const [
    hierarchyData,
    assignments,
    enrollments,
    lessonProgress,
    activityCompletions,
    activitySubmissions,
    lessonNotes,
    liaConversations,
    quizSubmissions,
  ] = await Promise.all([
    hierarchyDataPromise,
    fetchAssignmentRecords(supabase, organizationId),
    fetchEnrollmentRecords(supabase, organizationUserIds),         // structural: no date filter
    fetchLessonProgressRecords(supabase, organizationUserIds, dateRange),
    fetchActivityCompletionRecords(supabase, organizationUserIds, dateRange),
    fetchActivitySubmissionRecords(supabase, organizationId, organizationUserIds, dateRange),
    fetchLessonNoteRecords(supabase, organizationUserIds, dateRange),
    fetchLiaConversationRecords(supabase, organizationUserIds, dateRange),
    fetchQuizSubmissionRecords(supabase, organizationUserIds, dateRange),
  ])

  const [liaMessages, activityEvaluations] = await Promise.all([
    fetchLiaMessages(supabase, liaConversations),
    fetchActivityEvaluations(supabase, activitySubmissions),
  ])

  return {
    organizationUsers: hierarchyData.organizationUsers,
    regions: hierarchyData.regions,
    zones: hierarchyData.zones,
    teams: hierarchyData.teams,
    assignments,
    enrollments,
    lessonProgress,
    activityCompletions,
    activitySubmissions,
    activityEvaluations,
    lessonNotes,
    liaConversations,
    liaMessages,
    quizSubmissions,
  }
}
