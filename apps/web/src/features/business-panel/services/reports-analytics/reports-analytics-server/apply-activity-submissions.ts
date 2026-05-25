import { buildLatestActivityEvaluationBySubmission } from './build-latest-activity-evaluation-by-submission'
import { ensureCourse } from './ensure-course'
import { getActivitySubmissionQualityScore } from './get-activity-submission-quality-score'
import { isCompletedActivitySubmission } from './is-completed-activity-submission'
import { pushAiSample } from './push-ai-sample'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { stringifySampleContent } from './stringify-sample-content'
import { unwrapRelation } from './unwrap-relation'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { BuildContext } from './build-context'

export function applyActivitySubmissions(
  context: BuildContext,
  records: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
): void {
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)

  records.forEach((record) => {
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, record.course_id, [
        record.submitted_at,
        record.last_validated_at,
        record.created_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const activity = unwrapRelation(record.lesson_activities)
    const course = ensureCourse(context, record.course_id, unwrapRelation(record.courses)?.title)
    const latestEvaluation = latestEvaluationBySubmission.get(record.submission_id) || null
    const completed = isCompletedActivitySubmission(record, latestEvaluation)
    const needsHelp = latestEvaluation?.result_status === 'revise' || record.status === 'needs_revision'
    const qualityScore = getActivitySubmissionQualityScore(record, latestEvaluation)

    user.detail.activityAttempts += 1
    user.activityQualityScores.push(qualityScore)
    course.activityTotal += 1
    course.activeLearners.add(record.user_id)

    if (completed) {
      user.detail.activitiesCompleted += 1
      course.activityCompleted += 1
    }

    pushLastActivity(user, record.submitted_at, record.last_validated_at, record.created_at, record.updated_at)
    pushAiSample(context, {
      source: 'activity_response',
      userId: record.user_id,
      courseId: record.course_id,
      courseTitle: course.courseTitle,
      text: stringifySampleContent([
        record.response_text,
        record.response_payload,
        record.evidence_payload,
        latestEvaluation?.feedback_payload,
      ].filter(Boolean)),
      signals: {
        qualityScore,
        status: record.status,
        evaluation: latestEvaluation?.result_status || null,
        userNeededHelp: needsHelp,
        activityType: activity?.activity_type || null,
      },
    })
  })
}
