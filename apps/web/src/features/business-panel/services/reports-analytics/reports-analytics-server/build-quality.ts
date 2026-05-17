import type { ReportsAnalyticsQuality } from '../../../types/reports-analytics.types'
import { calculateAverage, calculatePercentage, calculateQualityScore, clampPercentage } from '../reports-analytics.helpers'
import { buildLatestActivityEvaluationBySubmission } from './build-latest-activity-evaluation-by-submission'
import { buildQualityRadar } from './build-quality-radar'
import { filterQualityActivities } from './filter-quality-activities'
import { filterQualityMessages } from './filter-quality-messages'
import { filterQualityNotes } from './filter-quality-notes'
import { filterQualityQuizzes } from './filter-quality-quizzes'
import { filterQualitySubmissions } from './filter-quality-submissions'
import { isCompletedActivitySubmission } from './is-completed-activity-submission'
import { isCompletedStatus } from './is-completed-status'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { BuildContext } from './build-context'
import type { LessonNoteRecord } from './lesson-note-record'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'
import type { QuizSubmissionRecord } from './quiz-submission-record'

export function buildQuality(
  context: BuildContext,
  activities: ActivityCompletionRecord[],
  submissions: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
  quizzes: QuizSubmissionRecord[],
  notes: LessonNoteRecord[],
): ReportsAnalyticsQuality {
  const includedActivities = filterQualityActivities(context, activities)
  const completedActivities = includedActivities.filter((activity) => isCompletedStatus(activity.status)).length
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)
  const includedSubmissions = filterQualitySubmissions(context, submissions)
  const completedSubmissions = includedSubmissions.filter((submission) =>
    isCompletedActivitySubmission(submission, latestEvaluationBySubmission.get(submission.submission_id) || null),
  ).length
  const usersNeedingHelp =
    includedActivities.filter((activity) => activity.user_needed_help).length +
    includedSubmissions.filter((submission) => {
      const evaluation = latestEvaluationBySubmission.get(submission.submission_id)
      return submission.status === 'needs_revision' || evaluation?.result_status === 'revise'
    }).length
  const redirects = includedActivities.reduce((sum, activity) => sum + (Number(activity.lia_had_to_redirect) || 0), 0)

  const includedQuizzes = filterQualityQuizzes(context, quizzes)
  const quizScores = includedQuizzes.map((quiz) => clampPercentage(Number(quiz.percentage_score) || 0))
  const quizPassed = includedQuizzes.filter((quiz) => quiz.is_passed).length

  const includedMessages = filterQualityMessages(context, conversations, messages)
  const userMessages = includedMessages.filter((message) => message.role === 'user')
  const offTopicMessages = userMessages.filter((message) => message.is_off_topic).length
  const questionMessages = userMessages.filter((message) => message.contains_question).length
  const responseTimes = includedMessages
    .map((message) => Number(message.response_time_ms))
    .filter((value) => Number.isFinite(value) && value > 0)
  const sentimentScores = includedMessages
    .map((message) => Number(message.sentiment_score))
    .filter((value) => Number.isFinite(value))

  const includedNotes = filterQualityNotes(context, notes)
  const notesWithContent = includedNotes.filter((note) => Boolean(note.note_content)).length

  const quizScore = calculateAverage(quizScores)
  const totalActivityEvidence = includedActivities.length + includedSubmissions.length
  const activityCompletionRate = calculatePercentage(
    completedActivities + completedSubmissions,
    totalActivityEvidence,
  )
  const helpRate = calculatePercentage(usersNeedingHelp, totalActivityEvidence)
  const redirectRate = calculatePercentage(redirects, totalActivityEvidence)
  const offTopicRate = calculatePercentage(offTopicMessages, userMessages.length)
  const questionRate = calculatePercentage(questionMessages, userMessages.length)
  const averageSentiment = sentimentScores.length > 0 ? Math.round(calculateAverage(sentimentScores) * 100) / 100 : 0
  const sofliaScore = clampPercentage(70 + questionRate * 0.15 - offTopicRate * 0.35 - redirectRate * 0.15 + averageSentiment * 10)
  const activityScore = clampPercentage(activityCompletionRate - helpRate * 0.25 - redirectRate * 0.2)
  const notesScore = calculatePercentage(notesWithContent, includedNotes.length)
  const overallScore = calculateQualityScore([quizScore, activityScore, sofliaScore, notesScore])

  return {
    overallScore,
    quizScore,
    activityScore,
    sofliaScore,
    notesScore,
    quizPassRate: calculatePercentage(quizPassed, includedQuizzes.length),
    quizAverageScore: quizScore,
    activityCompletionRate,
    helpRate,
    redirectRate,
    offTopicRate,
    questionRate,
    averageResponseTimeSeconds: calculateAverage(responseTimes.map((value) => value / 1000)),
    averageSentiment,
    evidenceCount: totalActivityEvidence + includedQuizzes.length + userMessages.length + includedNotes.length,
    radar: buildQualityRadar({ quizScore, activityScore, sofliaScore, notesScore }),
  }
}
