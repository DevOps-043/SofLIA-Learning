import { fetchActivityEvaluations } from './fetch-activity-evaluations'
import { fetchActivityCompletionRecords } from './fetch-activity-completion-records'
import { fetchActivitySubmissionRecords } from './fetch-activity-submission-records'
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
import { fetchStudySessionRecords } from './fetch-study-session-records'
import { uniqueValues } from './unique-values'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'

export async function fetchReportsAnalyticsQueryData(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
): Promise<AnalyticsQueryData> {
  const organizationUsers = await fetchOrganizationUsers(supabase, organizationId)
  const organizationUserIds = uniqueValues(organizationUsers.map((record) => record.user_id))
  const hierarchySupabase = supabase as unknown as ReportsAnalyticsUntypedSupabaseClient

  const [
    regions,
    zones,
    teams,
    assignments,
    enrollments,
    lessonProgress,
    activityCompletions,
    activitySubmissions,
    lessonNotes,
    liaConversations,
    quizSubmissions,
    studySessions,
  ] = await Promise.all([
    fetchOrganizationRegions(hierarchySupabase, organizationId),
    fetchOrganizationZones(hierarchySupabase, organizationId),
    fetchOrganizationTeams(hierarchySupabase, organizationId),
    fetchAssignmentRecords(supabase, organizationId),
    fetchEnrollmentRecords(supabase, organizationUserIds),
    fetchLessonProgressRecords(supabase, organizationUserIds),
    fetchActivityCompletionRecords(supabase, organizationUserIds),
    fetchActivitySubmissionRecords(supabase, organizationId, organizationUserIds),
    fetchLessonNoteRecords(supabase, organizationUserIds),
    fetchLiaConversationRecords(supabase, organizationUserIds),
    fetchQuizSubmissionRecords(supabase, organizationUserIds),
    fetchStudySessionRecords(supabase, organizationUserIds),
  ])

  const [liaMessages, activityEvaluations] = await Promise.all([
    fetchLiaMessages(supabase, liaConversations),
    fetchActivityEvaluations(supabase, activitySubmissions),
  ])

  return {
    organizationUsers,
    regions,
    zones,
    teams,
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
    studySessions,
  }
}
