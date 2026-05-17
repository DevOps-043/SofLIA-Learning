import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { isWithinPeriod } from './is-within-period'
import { QueryData } from './query-data'

export function collectContributionDates(data: QueryData, period: BusinessUserAnalyticsPeriod): string[] {
  const dates = [
    ...data.userSessions.map((session) => session.issued_at),
    ...data.lessonProgress.flatMap((progress) => [
      progress.started_at,
      progress.last_activity_submission_at,
      progress.last_accessed_at,
      progress.completed_at,
      progress.updated_at,
    ]),
    ...data.studySessions.flatMap((session) => [
      session.started_at,
      session.completed_at,
      session.start_time,
      session.updated_at,
    ]),
    ...data.lessonNotes.flatMap((note) => [note.created_at, note.updated_at]),
    ...data.liaConversations.flatMap((conversation) => [
      conversation.started_at,
      conversation.ended_at,
      conversation.created_at,
      conversation.updated_at,
    ]),
    ...data.liaMessages.map((message) => message.created_at),
    ...data.activitySubmissions.flatMap((submission) => [
      submission.submitted_at,
      submission.last_validated_at,
      submission.updated_at,
    ]),
    ...data.activityCompletions.flatMap((completion) => [
      completion.started_at,
      completion.completed_at,
      completion.updated_at,
    ]),
    ...data.quizSubmissions.flatMap((quiz) => [quiz.completed_at, quiz.created_at, quiz.updated_at]),
    ...data.lessonTracking.flatMap((tracking) => [
      tracking.started_at,
      tracking.last_activity_at,
      tracking.completed_at,
      tracking.updated_at,
    ]),
  ].filter((date): date is string => Boolean(date))

  return dates.filter((date) => isWithinPeriod(date, period))
}
