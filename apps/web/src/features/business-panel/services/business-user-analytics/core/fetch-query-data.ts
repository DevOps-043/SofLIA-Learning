import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildAnalyticsScope } from './build-analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { fetchActivityCompletions } from './fetch-activity-completions'
import { fetchActivityEvaluations } from './fetch-activity-evaluations'
import { fetchActivitySubmissions } from './fetch-activity-submissions'
import { fetchAssignments } from './fetch-assignments'
import { fetchCertificates } from './fetch-certificates'
import { fetchCourseLessons } from './fetch-course-lessons'
import { fetchDialogueResults } from './fetch-dialogue-results'
import { fetchDialogueSessions } from './fetch-dialogue-sessions'
import { fetchDialogueTurns } from './fetch-dialogue-turns'
import { fetchEnrollments } from './fetch-enrollments'
import { resolveDialogueServiceClient } from './dialogue-service-client'
import { fetchLessonActivities } from './fetch-lesson-activities'
import { fetchLessonNotes } from './fetch-lesson-notes'
import { fetchLessonProgress } from './fetch-lesson-progress'
import { fetchLessonTracking } from './fetch-lesson-tracking'
import { fetchLiaConversations } from './fetch-lia-conversations'
import { fetchLiaMessages } from './fetch-lia-messages'
import { fetchQuizSubmissions } from './fetch-quiz-submissions'
import { fetchQuizAttempts } from './fetch-quiz-attempts'
import { fetchQuizLessonIds } from './fetch-quiz-lessons'
import { fetchUserSessions } from './fetch-user-sessions'
import { QueryData } from './query-data'

export async function fetchQueryData(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
  includeAllUserEnrollments = false,
): Promise<QueryData> {
  const [assignments, allEnrollments, allCertificates, userSessions] = await Promise.all([
    fetchAssignments(supabase, userId, organizationId),
    fetchEnrollments(supabase, userId),
    fetchCertificates(supabase, userId),
    fetchUserSessions(supabase, userId, period),
  ])
  const assignedCourseIds = new Set(assignments.map((assignment) => assignment.course_id))
  // En la vista de superadmin se incluye TODA la actividad del usuario (puede estar
  // en varias organizaciones o en enrollments personales). En la vista del propio
  // usuario se acota a su organización (o cursos asignados / enrollments personales).
  const enrollments = includeAllUserEnrollments
    ? allEnrollments
    : allEnrollments.filter((enrollment) => enrollment.organization_id === organizationId)
  const courseIds = new Set([
    ...assignedCourseIds,
    ...enrollments.map((enrollment) => enrollment.course_id),
  ])
  const courseLessons = await fetchCourseLessons(supabase, Array.from(courseIds))
  const scope = buildAnalyticsScope(assignments, enrollments, courseLessons)
  const lessonActivities = await fetchLessonActivities(supabase, Array.from(scope.lessonIds))
  // Certificados acotados por enrollment (cada uno encierra la organización), igual
  // que el resto de señales. Los certificados sin enrollment resuelto se omiten.
  const certificates = allCertificates.filter(
    (certificate) => certificate.enrollment_id != null && scope.enrollmentIds.has(certificate.enrollment_id),
  )

  // Las tablas `soflia_dialogue_*` son `service_role only`; se leen con un cliente
  // elevado para que funcione también la analítica del propio usuario (cliente con
  // sesión). El filtrado sigue acotado a `user_id` + enrollments del scope.
  const dialogueClient = resolveDialogueServiceClient()

  const [
    lessonProgress,
    activitySubmissions,
    activityCompletions,
    dialogueResults,
    dialogueSessions,
    liaConversations,
    lessonNotes,
    quizSubmissions,
    quizAttempts,
    quizLessonIds,
    lessonTracking,
  ] = await Promise.all([
    fetchLessonProgress(supabase, userId, scope),
    fetchActivitySubmissions(supabase, userId, scope),
    fetchActivityCompletions(supabase, userId, scope),
    dialogueClient ? fetchDialogueResults(dialogueClient, userId, scope) : Promise.resolve([]),
    dialogueClient ? fetchDialogueSessions(dialogueClient, userId, scope) : Promise.resolve([]),
    fetchLiaConversations(supabase, userId, organizationId, scope),
    fetchLessonNotes(supabase, userId, organizationId, scope),
    fetchQuizSubmissions(supabase, userId, scope),
    fetchQuizAttempts(supabase, userId, scope),
    fetchQuizLessonIds(supabase, Array.from(scope.lessonIds)),
    fetchLessonTracking(supabase, userId, organizationId, scope),
  ])

  const [activityEvaluations, liaMessages, dialogueTurns] = await Promise.all([
    fetchActivityEvaluations(
      supabase,
      activitySubmissions.map((submission) => submission.submission_id),
    ),
    fetchLiaMessages(
      supabase,
      liaConversations.map((conversation) => conversation.conversation_id),
    ),
    dialogueClient
      ? fetchDialogueTurns(dialogueClient, dialogueSessions.map((session) => session.session_id))
      : Promise.resolve([]),
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
    dialogueResults,
    dialogueSessions,
    dialogueTurns,
    liaConversations,
    liaMessages,
    lessonNotes,
    quizSubmissions,
    quizAttempts,
    quizLessonIds,
    certificates,
    userSessions,
    lessonTracking,
  }
}
