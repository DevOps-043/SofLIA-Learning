import type { ActivityConfig } from '../types/activity-config'

type SubmissionLike = {
  evidencePayload?: Record<string, unknown> | null
  responsePayload?: Record<string, unknown> | null
  responseText?: string | null
}

export type ActivitySubmissionRequirementIssue = {
  code:
    | 'response_required'
    | 'evidence_required'
    | 'required_fields_missing'
    | 'required_checklist_items_missing'
  message: string
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function getPrimaryResponseText(submission: SubmissionLike): string {
  const directText = normalizeText(submission.responseText)
  if (directText) {
    return directText
  }

  return normalizeText(submission.responsePayload?.text)
}

function getEvidenceText(submission: SubmissionLike): string {
  return normalizeText(submission.evidencePayload?.text)
}

function formatMissingLabels(labels: string[]): string {
  if (labels.length === 1) {
    return labels[0]
  }

  if (labels.length === 2) {
    return `${labels[0]} y ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
}

export function getActivitySubmissionRequirementIssues(
  activityConfig: ActivityConfig,
  submission: SubmissionLike,
): ActivitySubmissionRequirementIssue[] {
  const issues: ActivitySubmissionRequirementIssue[] = []
  const responsePayload = toRecord(submission.responsePayload)

  if (
    activityConfig.interactionType === 'long_text' ||
    activityConfig.interactionType === 'external_tool_task'
  ) {
    if (!getPrimaryResponseText(submission)) {
      issues.push({
        code: 'response_required',
        message: 'Debes escribir tu respuesta antes de enviar la actividad.',
      })
    }
  }

  if (activityConfig.interactionType === 'inline_answers') {
    const answers = toRecord(responsePayload.answers)
    const missingFields = activityConfig.submission.fields
      .filter((field) => field.required)
      .filter((field) => !normalizeText(answers[field.id]))
      .map((field) => field.label)

    if (missingFields.length > 0) {
      issues.push({
        code: 'required_fields_missing',
        message: `Completa los campos requeridos: ${formatMissingLabels(missingFields)}.`,
      })
    }
  }

  if (activityConfig.interactionType === 'checklist') {
    const checklist = toRecord(responsePayload.checklist)
    const missingItems = activityConfig.submission.checklistItems
      .filter((item) => item.required)
      .filter((item) => checklist[item.id] !== true)
      .map((item) => item.label)

    if (missingItems.length > 0) {
      issues.push({
        code: 'required_checklist_items_missing',
        message: `Completa los pasos requeridos: ${formatMissingLabels(missingItems)}.`,
      })
    }
  }

  if (activityConfig.submission.requireEvidence && !getEvidenceText(submission)) {
    issues.push({
      code: 'evidence_required',
      message: 'Debes agregar la evidencia requerida antes de enviar la actividad.',
    })
  }

  return issues
}

export function isActivitySubmissionStructurallyComplete(
  activityConfig: ActivityConfig,
  submission: SubmissionLike,
) {
  return getActivitySubmissionRequirementIssues(activityConfig, submission)
    .length === 0
}

export function summarizeActivitySubmissionRequirementIssues(
  issues: ActivitySubmissionRequirementIssue[],
): string {
  if (issues.length === 0) {
    return ''
  }

  if (issues.length === 1) {
    return issues[0].message
  }

  return issues.map((issue) => issue.message).join(' ')
}
