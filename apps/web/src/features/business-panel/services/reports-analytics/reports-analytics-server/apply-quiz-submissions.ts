import { REPORTS_ANALYTICS_UNSPECIFIED, clampPercentage } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { pushAiSample } from './push-ai-sample'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { stringifySampleContent } from './stringify-sample-content'
import { unwrapRelation } from './unwrap-relation'
import type { BuildContext } from './build-context'
import type { QuizSubmissionRecord } from './quiz-submission-record'

export function applyQuizSubmissions(context: BuildContext, records: QuizSubmissionRecord[]): void {
  records.forEach((record) => {
    const enrollment = unwrapRelation(record.user_course_enrollments)
    const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED

    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.completed_at,
        record.created_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(enrollment?.courses)?.title)
    const score = clampPercentage(Number(record.percentage_score) || 0)

    user.detail.quizAttempts += 1
    user.quizScores.push(score)
    course.quizScores.push(score)
    course.activeLearners.add(record.user_id)
    pushLastActivity(user, record.completed_at, record.created_at, record.updated_at)
    pushAiSample(context, {
      source: 'quiz_response',
      userId: record.user_id,
      courseId,
      courseTitle: unwrapRelation(enrollment?.courses)?.title || context.courses.get(courseId)?.courseTitle,
      text: stringifySampleContent(record.user_answers),
      signals: {
        percentageScore: score,
        rawScore: record.score ?? null,
        totalPoints: record.total_points ?? null,
        passed: record.is_passed,
      },
    })
  })
}
