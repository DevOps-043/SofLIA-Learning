import {
  activityConfigSchema,
  type ActivityChecklistItem,
  type ActivityField,
  type ActivityInteractionType,
  type ExternalToolKey,
} from '@/features/courses/types/activity-config'

interface BuildInteractiveConfigInput {
  checklistItems: ActivityChecklistItem[]
  evidencePlaceholder: string
  fields: ActivityField[]
  interactionType: ActivityInteractionType
  maxLength: number | ''
  openInNewTab: boolean
  promptTemplate: string
  requireEvidence: boolean
  requiredForCompletion: boolean
  responsePlaceholder: string
  rubricText: string
  showCopyButton: boolean
  toolKey: ExternalToolKey | ''
  validationEnabled: boolean
}

export function buildInteractiveActivityConfig(input: BuildInteractiveConfigInput) {
  const baseSubmission: Record<string, unknown> = {
    responsePlaceholder: input.responsePlaceholder.trim() || undefined,
    evidencePlaceholder: input.evidencePlaceholder.trim() || undefined,
    requireEvidence: input.requireEvidence,
    ...(input.maxLength ? { maxLength: Number(input.maxLength) } : {}),
  }
  const rubric = input.rubricText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => ({
      id: `rubric_${index + 1}`,
      label: item,
      description: item,
    }))
  const baseConfig: Record<string, unknown> = {
    interactionType: input.interactionType,
    submission: baseSubmission,
    validation: {
      enabled: input.validationEnabled,
      requiredForCompletion: input.validationEnabled && input.requiredForCompletion,
      rubric,
    },
    ...(input.toolKey
      ? {
          toolTask: {
            toolKey: input.toolKey,
            promptTemplate: input.promptTemplate,
            openInNewTab: input.openInNewTab,
            showCopyButton: input.showCopyButton,
          },
        }
      : {}),
  }
  applyStructuredSubmission(baseConfig, input)
  return activityConfigSchema.parse(baseConfig)
}

function applyStructuredSubmission(
  baseConfig: Record<string, unknown>,
  input: BuildInteractiveConfigInput,
) {
  if (input.interactionType === 'inline_answers') {
    baseConfig.submission = {
      ...(baseConfig.submission as Record<string, unknown>),
      fields: input.fields.map((field, index) => ({
        ...field,
        id: field.id.trim() || `field_${index + 1}`,
        label: field.label.trim() || `Campo ${index + 1}`,
      })),
    }
  }
  if (input.interactionType === 'checklist') {
    baseConfig.submission = {
      checklistItems: input.checklistItems.map((item, index) => ({
        ...item,
        id: item.id.trim() || `check_${index + 1}`,
        label: item.label.trim() || `Paso ${index + 1}`,
      })),
      responsePlaceholder: input.responsePlaceholder.trim() || undefined,
      evidencePlaceholder: input.evidencePlaceholder.trim() || undefined,
      requireEvidence: input.requireEvidence,
    }
  }
}
