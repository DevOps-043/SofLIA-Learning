import type { ActivitySubmissionRequest } from '../../types/activity-config'

import type {
  ActivitySubmissionMutationPayload,
  ActivitySubmissionRow,
  CourseActivityContext,
} from './types'

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

export function buildSubmissionUpsertPayload(
  context: CourseActivityContext,
  request: ActivitySubmissionRequest,
  now: string,
): ActivitySubmissionMutationPayload {
  const responsePayload = toRecord(request.responsePayload)
  const evidencePayload = request.evidencePayload
    ? toRecord(request.evidencePayload)
    : null

  return {
    activity_id: context.activity.activity_id,
    course_id: context.courseId,
    enrollment_id: context.enrollmentId,
    evidence_payload: evidencePayload,
    last_validated_at: null,
    lesson_id: context.lessonId,
    organization_id: context.organizationId,
    response_payload: responsePayload,
    response_text: request.responseText?.trim() || null,
    status: request.status,
    submitted_at: request.status === 'submitted' ? now : null,
    updated_at: now,
    user_id: context.userId,
  }
}

export type ActivitySubmissionResponseFields = Pick<
  ActivitySubmissionRow,
  'response_payload' | 'response_text' | 'evidence_payload'
> &
  Partial<Pick<ActivitySubmissionRow, 'status'>>

export type ActivitySubmissionCompletionFields = Pick<
  ActivitySubmissionRow,
  'status' | 'response_payload' | 'response_text' | 'evidence_payload'
>
