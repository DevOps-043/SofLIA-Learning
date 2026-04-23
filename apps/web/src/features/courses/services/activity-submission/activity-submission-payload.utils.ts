import type { ActivityConfig } from '../../types/activity-config'
import type { ActivitySubmissionRow } from './activity-submission.types'

export function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function getPayloadText(
  responseText: string | null | undefined,
  responsePayload: Record<string, unknown>,
): string {
  const directText = normalizeText(responseText)
  if (directText) {
    return directText
  }

  return normalizeText(responsePayload.text)
}

export function getEvidenceText(
  evidencePayload: Record<string, unknown> | null,
): string {
  return normalizeText(evidencePayload?.text)
}

export function getInlineAnswerMap(responsePayload: Record<string, unknown>) {
  const answers = responsePayload.answers
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {}
  }

  return answers as Record<string, unknown>
}

export function getChecklistMap(responsePayload: Record<string, unknown>) {
  const checklist = responsePayload.checklist
  if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) {
    return {}
  }

  return checklist as Record<string, unknown>
}

export function hasAnyActivityResponse(
  activityConfig: ActivityConfig,
  submission: Pick<
    ActivitySubmissionRow,
    'response_payload' | 'response_text' | 'evidence_payload'
  >,
) {
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
