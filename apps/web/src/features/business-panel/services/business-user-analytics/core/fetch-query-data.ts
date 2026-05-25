import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildAnalyticsScope } from './build-analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { fetchActivityCompletions } from './fetch-activity-completions'
import { fetchActivityEvaluations } from './fetch-activity-evaluations'
import { fetchActivitySubmissions } from './fetch-activity-submissions'
import { fetchAssignments } from './fetch-assignments'
import { fetchCertificates } from './fetch-certificates'
import { fetchCourseLessons } from './fetch-course-lessons'
import { fetchEnrollments } from './fetch-enrollments'
import { fetchLessonActivities } from './fetch-lesson-activities'
import { fetchLessonNotes } from './fetch-lesson-notes'
import { fetchLessonProgress } from './fetch-lesson-progress'
import { fetchLessonTracking } from './fetch-lesson-tracking'
import { fetchLiaConversations } from './fetch-lia-conversations'
import { fetchLiaMessages } from './fetch-lia-messages'
import { fetchQuizSubmissions } from './fetch-quiz-submissions'
import { fetchStudySessions } from './fetch-study-sessions'
import { fetchUserSessions } from './fetch-user-sessions'
import { QueryData } from './query-data'

export async function fetchQueryData(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
): Promise<QueryData> {
  const [assignments, allEnrollments, allCertificates, userSessions] = await Promise.all([
    fetchAssignments(supabase, userId, organizationId),
    fetchEnrollments(supabase, userId),
    fetchCertificates(supabase, userId),
    fetchUserSessions(supabase, userId, period),
  ])
  const assignedCourseIds = new Set(assignments.map((assignment) => assignment.course_id))
  const enrollments = allEnrollments.filter((enrollment) =>
    enrollment.organization_id === organizationId || assignedCourseIds.has(enrollment.course_id),
  )
  const courseIds = new Set([
    ...assignedCourseIds,
    ...enrollments.map((enrollment) => enrollment.course_id),
  ])
  const courseLessons = await fetchCourseLessons(supabase, Array.from(courseIds))
  const scope = buildAnalyticsScope(assignments, enrollments, courseLessons)
  const lessonActivities = await fetchLessonActivities(supabase, Array.from(scope.lessonIds))
  const certificates = allCertificates.filter((certificate) =>
    certificate.organization_id === organizationId || scope.courseIds.has(certificate.course_id),
  )

  const [
    lessonProgress,
    activitySubmissions,
    activityCompletions,
    liaConversations,
    studySessions,
    lessonNotes,
    quizSubmissions,
    lessonTracking,
  ] = await Promise.all([
    fetchLessonProgress(supabase, userId, scope),
    fetchActivitySubmissions(supabase, userId, scope),
    fetchActivityCompletions(supabase, userId, organizationId, scope),
    fetchLiaConversations(supabase, userId, organizationId, scope),
    fetchStudySessions(supabase, userId, organizationId, scope),
    fetchLessonNotes(supabase, userId, organizationId, scope),
    fetchQuizSubmissions(supabase, userId, scope),
    fetchLessonTracking(supabase, userId, organizationId, scope),
  ])

  const [activityEvaluations, liaMessages] = await Promise.all([
    fetchActivityEvaluations(
      supabase,
      activitySubmissions.map((submission) => submission.submission_id),
    ),
    fetchLiaMessages(
      supabase,
      liaConversations.map((conversation) => conversation.conversation_id),
    ),
  ])

  return {
    assignments,
    enrollments,
    courseLessons,
    lessonActivities,
    lessonProgress,
    activitySubmissions,
    activityCompletions,
    activityEvaluations,
    liaConversations,
    liaMessages,
    studySessions,
    lessonNotes,
    quizSubmissions,
    certificates,
    userSessions,
    lessonTracking,
  }
}
