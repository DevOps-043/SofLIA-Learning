import type { ActivityConfig } from '../../types/activity-config'

import {
  getChecklistMap,
  getEvidenceText,
  getInlineAnswerMap,
  getPayloadText,
  normalizeText,
  type ActivitySubmissionCompletionFields,
  type ActivitySubmissionResponseFields,
} from './payload'
import type { ActivityEvaluationRow } from './types'

export function hasAnyActivityResponse(
  activityConfig: ActivityConfig,
  submission: ActivitySubmissionResponseFields,
) {
  if (activityConfig.interactionType === 'soflia_dialogue') {
    return submission.status !== 'draft'
  }

  const responseText = getPayloadText(
    submission.response_text,
    submission.response_payload,
  )
  const evidenceText = getEvidenceText(submission.evidence_payload)

  if (responseText || evidenceText) {
    return true
  }

  if (activityConfig.interactionType === 'inline_answers') {
    return Object.values(getInlineAnswerMap(submission.response_payload)).some(
      (value) => normalizeText(value).length > 0,
    )
  }

  if (activityConfig.interactionType === 'checklist') {
    return Object.values(getChecklistMap(submission.response_payload)).some(
      (value) => value === true,
    )
  }

  return false
}

export function isActivitySubmissionCompletionSatisfied(
  activityConfig: ActivityConfig,
  submission: ActivitySubmissionCompletionFields,
  latestEvaluation: ActivityEvaluationRow | null,
) {
  if (activityConfig.interactionType === 'soflia_dialogue') {
    return submission.status === 'validated'
  }

  if (submission.status === 'draft') return false

  const responseText = getPayloadText(
    submission.response_text,
    submission.response_payload,
  )

  if (
    (activityConfig.interactionType === 'long_text' ||
      activityConfig.interactionType === 'external_tool_task') &&
    !responseText
  ) {
    return false
  }

  if (activityConfig.interactionType === 'inline_answers') {
    const answers = getInlineAnswerMap(submission.response_payload)
    const requiredAnswersPresent = activityConfig.submission.fields
      .filter((field) => field.required)
      .every((field) => normalizeText(answers[field.id]).length > 0)

    if (!requiredAnswersPresent) return false
  }

  if (activityConfig.interactionType === 'checklist') {
    const checklist = getChecklistMap(submission.response_payload)
    const requiredChecklistDone = activityConfig.submission.checklistItems
      .filter((item) => item.required)
      .every((item) => checklist[item.id] === true)

    if (!requiredChecklistDone) return false
  }

  if (activityConfig.submission.requireEvidence) {
    const evidenceText = getEvidenceText(submission.evidence_payload)
    if (!evidenceText) return false
  }

  if (activityConfig.validation.requiredForCompletion) {
    return latestEvaluation?.result_status === 'pass'
  }

  return true
}
