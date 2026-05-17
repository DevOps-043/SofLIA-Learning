import { calculatePercentage, clampPercentage } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { getCourseIdFromActivityCompletion } from './get-course-id-from-activity-completion'
import { isCompletedStatus } from './is-completed-status'
import { pushAiSample } from './push-ai-sample'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { stringifySampleContent } from './stringify-sample-content'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { BuildContext } from './build-context'

export function applyActivityCompletions(context: BuildContext, records: ActivityCompletionRecord[]): void {
  records.forEach((record) => {
    const courseId = getCourseIdFromActivityCompletion(record)
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.started_at,
        record.completed_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, null)
    const completed = isCompletedStatus(record.status)
    const stepScore = record.total_steps
      ? calculatePercentage(Number(record.completed_steps) || 0, Number(record.total_steps) || 0)
      : completed ? 100 : 0
    const attemptsPenalty = Math.min(25, Math.max(0, (Number(record.attempts_to_complete) || 1) - 1) * 8)
    const helpPenalty = record.user_needed_help ? 10 : 0
    const redirectPenalty = Math.min(20, (Number(record.lia_had_to_redirect) || 0) * 5)
    const qualityScore = clampPercentage(stepScore - attemptsPenalty - helpPenalty - redirectPenalty)

    user.detail.activityAttempts += Number(record.attempts_to_complete) || 0
    user.activityQualityScores.push(qualityScore)
    course.activityTotal += 1
    course.activeLearners.add(record.user_id)

    if (completed) {
      user.detail.activitiesCompleted += 1
      course.activityCompleted += 1
    }

    pushLastActivity(user, record.started_at, record.completed_at, record.updated_at)
    pushAiSample(context, {
      source: 'activity_response',
      userId: record.user_id,
      courseId,
      courseTitle: context.courses.get(courseId)?.courseTitle,
      text: stringifySampleContent(record.generated_output),
      signals: {
        qualityScore,
        status: record.status,
        attempts: record.attempts_to_complete,
        userNeededHelp: record.user_needed_help,
        redirects: record.lia_had_to_redirect,
      },
    })
  })
}
