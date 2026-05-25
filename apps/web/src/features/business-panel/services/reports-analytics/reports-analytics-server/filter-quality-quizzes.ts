import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { unwrapRelation } from './unwrap-relation'
import type { BuildContext } from './build-context'
import type { QuizSubmissionRecord } from './quiz-submission-record'

export function filterQualityQuizzes(
  context: BuildContext,
  quizzes: QuizSubmissionRecord[],
): QuizSubmissionRecord[] {
  return quizzes.filter((quiz) => {
    const enrollment = unwrapRelation(quiz.user_course_enrollments)
    return shouldIncludeEngagementRecord(context, quiz.user_id, enrollment?.course_id, [
      quiz.completed_at,
      quiz.created_at,
      quiz.updated_at,
    ])
  })
}
