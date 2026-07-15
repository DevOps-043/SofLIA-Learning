import { applyActivityCompletions } from './apply-activity-completions'
import { applyActivitySubmissions } from './apply-activity-submissions'
import { applyAssignments } from './apply-assignments'
import { applyEnrollments } from './apply-enrollments'
import { applyLessonNotes } from './apply-lesson-notes'
import { applyLessonProgress } from './apply-lesson-progress'
import { applyLiaConversations } from './apply-lia-conversations'
import { applyQuizSubmissions } from './apply-quiz-submissions'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { BuildContext } from './build-context'

export function applyReportsAnalyticsRecords(
  context: BuildContext,
  queryData: AnalyticsQueryData,
): void {
  applyAssignments(context, queryData.assignments)
  applyEnrollments(context, queryData.enrollments)
  applyLessonProgress(context, queryData.lessonProgress)
  applyActivityCompletions(context, queryData.activityCompletions)
  applyActivitySubmissions(context, queryData.activitySubmissions, queryData.activityEvaluations)
  applyLessonNotes(context, queryData.lessonNotes)
  applyLiaConversations(context, queryData.liaConversations, queryData.liaMessages)
  applyQuizSubmissions(context, queryData.quizSubmissions)
}
