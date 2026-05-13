import { normalizeContentForRenderer } from '@/lib/course-content'

import type {
  ActivityConfig,
  ActivitySubmissionRequest,
  ActivityValidationRubricItem,
} from '../types/activity-config'

type ActivityEvaluationMessageActivity = {
  activity_title: string
  activity_description?: string
  activity_type: string
  activity_content: unknown
  activity_config?: ActivityConfig | null
  is_required: boolean
  latest_submission_summary?: {
    completionSatisfied?: boolean
  } | null
}

type BuildActivitySofliaEvaluationMessageInput = {
  activity: ActivityEvaluationMessageActivity
  request: Pick<
    ActivitySubmissionRequest,
    'responseText' | 'responsePayload' | 'evidencePayload'
  >
}

const MAX_ACTIVITY_CONTENT_LENGTH = 3500
const MAX_PROMPT_TEMPLATE_LENGTH = 2500
const MAX_LONG_TEXT_RESPONSE_LENGTH = 5000
const emptyListLabel = '(sin respuesta)'

function normalizeTextValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function normalizeRecordValue(
  value: unknown,
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
}

function buildRubricLines(rubric: ActivityValidationRubricItem[]): string[] {
  if (rubric.length === 0) {
    return []
  }

  return rubric.map((criterion) => {
    const description = normalizeTextValue(criterion.description)
    return description
      ? `- ${criterion.label}: ${description}`
      : `- ${criterion.label}`
  })
}

function buildInlineAnswerLines(
  activityConfig: ActivityConfig,
  responsePayload: Record<string, unknown> | null,
): string[] {
  if (activityConfig.interactionType !== 'inline_answers') {
    return []
  }

  const answers = normalizeRecordValue(responsePayload?.answers)

  return activityConfig.submission.fields.map((field) => {
    const answer = normalizeTextValue(answers?.[field.id]) || emptyListLabel
    return `- ${field.label}: ${answer}`
  })
}

function buildChecklistLines(
  activityConfig: ActivityConfig,
  responsePayload: Record<string, unknown> | null,
): string[] {
  if (activityConfig.interactionType !== 'checklist') {
    return []
  }

  const checklistValues = normalizeRecordValue(responsePayload?.checklist)

  return activityConfig.submission.checklistItems.map((item) => {
    const isCompleted = checklistValues?.[item.id] === true
    return `- ${item.label}: ${isCompleted ? 'completado' : 'pendiente'}`
  })
}

function resolvePrimaryResponseText(
  request: Pick<
    ActivitySubmissionRequest,
    'responseText' | 'responsePayload'
  >,
): string | null {
  return (
    normalizeTextValue(request.responseText) ||
    normalizeTextValue(normalizeRecordValue(request.responsePayload)?.text)
  )
}

function resolveEvidenceText(
  evidencePayload: ActivitySubmissionRequest['evidencePayload'],
): string | null {
  return normalizeTextValue(normalizeRecordValue(evidencePayload)?.text)
}

export function hasActivityResponseForSofliaEvaluation({
  activity,
  request,
}: BuildActivitySofliaEvaluationMessageInput): boolean {
  const primaryResponseText = resolvePrimaryResponseText(request)
  const evidenceText = resolveEvidenceText(request.evidencePayload)
  const responsePayload = normalizeRecordValue(request.responsePayload)

  if (!activity.activity_config) {
    return Boolean(primaryResponseText || evidenceText)
  }

  if (activity.activity_config.interactionType === 'soflia_dialogue') {
    return false
  }

  if (activity.activity_config.interactionType === 'inline_answers') {
    const answers = normalizeRecordValue(responsePayload?.answers)
    const hasAnyAnswer =
      activity.activity_config.submission.fields.some((field) =>
        Boolean(normalizeTextValue(answers?.[field.id])),
      )

    return hasAnyAnswer || Boolean(evidenceText)
  }

  if (activity.activity_config.interactionType === 'checklist') {
    const checklistValues = normalizeRecordValue(responsePayload?.checklist)
    const hasCompletedItem = Object.values(checklistValues || {}).some(
      (value) => value === true,
    )

    return hasCompletedItem || Boolean(primaryResponseText || evidenceText)
  }

  return Boolean(primaryResponseText || evidenceText)
}

export function buildActivitySofliaEvaluationMessage({
  activity,
  request,
}: BuildActivitySofliaEvaluationMessageInput): string | null {
  if (
    !hasActivityResponseForSofliaEvaluation({
      activity,
      request,
    })
  ) {
    return null
  }

  const activityConfig = activity.activity_config
  const responsePayload = normalizeRecordValue(request.responsePayload)
  const normalizedInstructions = normalizeContentForRenderer(
    activity.activity_content,
  ).trim()
  const primaryResponseText = resolvePrimaryResponseText(request)
  const evidenceText = resolveEvidenceText(request.evidencePayload)
  const rubricLines = activityConfig
    ? activityConfig.interactionType === 'soflia_dialogue'
      ? []
      : buildRubricLines(activityConfig.validation.rubric)
    : []
  const sections: string[] = [
    '[SYSTEM_EVENT: ACTIVITY_EVALUATION_REQUEST]',
    'Evalua la actividad del usuario con tono claro, breve y accionable.',
    '',
    `Actividad: "${activity.activity_title}"`,
    `Tipo: "${activityConfig?.interactionType || activity.activity_type}"`,
    `Requerida: ${activity.is_required ? 'si' : 'no'}`,
  ]

  const description = normalizeTextValue(activity.activity_description)
  if (description) {
    sections.push('', 'Descripcion de la actividad:', description)
  }

  if (normalizedInstructions) {
    sections.push(
      '',
      'Instrucciones visibles de la actividad:',
      truncateText(normalizedInstructions, MAX_ACTIVITY_CONTENT_LENGTH),
    )
  }

  if (
    activityConfig &&
    activityConfig.interactionType !== 'soflia_dialogue' &&
    activityConfig.toolTask?.promptTemplate?.trim()
  ) {
    sections.push(
      '',
      'Prompt o guia base de la actividad:',
      truncateText(
        activityConfig.toolTask.promptTemplate.trim(),
        MAX_PROMPT_TEMPLATE_LENGTH,
      ),
    )
  }

  if (rubricLines.length > 0) {
    sections.push('', 'Criterios de revision:', ...rubricLines)
  }

  sections.push('', 'Respuesta actual del usuario:')

  if (!activityConfig) {
    sections.push(
      primaryResponseText
        ? truncateText(primaryResponseText, MAX_LONG_TEXT_RESPONSE_LENGTH)
        : emptyListLabel,
    )
  } else if (activityConfig.interactionType === 'inline_answers') {
    sections.push(...buildInlineAnswerLines(activityConfig, responsePayload))
  } else if (activityConfig.interactionType === 'checklist') {
    sections.push(...buildChecklistLines(activityConfig, responsePayload))

    if (primaryResponseText) {
      sections.push('', 'Notas del usuario:', primaryResponseText)
    }
  } else {
    sections.push(
      primaryResponseText
        ? truncateText(primaryResponseText, MAX_LONG_TEXT_RESPONSE_LENGTH)
        : emptyListLabel,
    )
  }

  if (evidenceText) {
    sections.push(
      '',
      'Evidencia adicional del usuario:',
      truncateText(evidenceText, MAX_LONG_TEXT_RESPONSE_LENGTH),
    )
  }

  sections.push(
    '',
    'Instrucciones para SofLIA:',
    '1. Indica que esta bien y que debe corregirse.',
    '2. Si hay errores, corrige solo las partes necesarias.',
    '3. Explica brevemente por que.',
    '4. Si falta informacion, di exactamente que falta.',
    '5. Cierra con un siguiente paso corto.',
  )

  return sections.join('\n')
}
