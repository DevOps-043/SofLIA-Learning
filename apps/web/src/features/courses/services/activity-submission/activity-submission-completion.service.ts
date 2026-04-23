import type { ActivityConfig } from '../../types/activity-config'
import type {
  ActivityEvaluationRow,
  ActivitySubmissionRow,
} from './activity-submission.types'
import {
  getChecklistMap,
  getEvidenceText,
  getInlineAnswerMap,
  getPayloadText,
  normalizeText,
} from './activity-submission-payload.utils'

export function isActivitySubmissionCompletionSatisfied(
  activityConfig: ActivityConfig,
  submission: Pick<
    ActivitySubmissionRow,
    'status' | 'response_payload' | 'response_text' | 'evidence_payload'
  >,
  latestEvaluation: ActivityEvaluationRow | null,
) {
  if (submission.status === 'draft') {
    return false
  }

  const responseText = getPayloadText(
    submission.response_text,
    submission.response_payload,
  )

  if (
    ['long_text', 'external_tool_task'].includes(activityConfig.interactionType) &&
    !responseText
  ) {
    return false
  }

  if (activityConfig.interactionType === 'inline_answers') {
    const answers = getInlineAnswerMap(submission.response_payload)
    const complete = activityConfig.submission.fields
      .filter((field) => field.required)
      .every((field) => normalizeText(answers[field.id]).length > 0)

    if (!complete) {
      return false
    }
  }

  if (activityConfig.interactionType === 'checklist') {
    const checklist = getChecklistMap(submission.response_payload)
    const complete = activityConfig.submission.checklistItems
      .filter((item) => item.required)
      .every((item) => checklist[item.id] === true)

    if (!complete) {
      return false
    }
  }

  if (activityConfig.submission.requireEvidence) {
    const evidenceText = getEvidenceText(submission.evidence_payload)
    if (!evidenceText) {
      return false
    }
  }

  if (activityConfig.validation.requiredForCompletion) {
    return latestEvaluation?.result_status === 'pass'
  }

  return true
}
