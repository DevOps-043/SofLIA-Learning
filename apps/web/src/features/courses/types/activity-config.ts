import { z } from 'zod'

export const supportedExternalToolKeys = [
  'chatgpt',
  'gemini',
  'notebooklm',
  'gamma',
  'atlas',
] as const

export type ExternalToolKey = (typeof supportedExternalToolKeys)[number]

export const activitySubmissionStatusSchema = z.enum([
  'draft',
  'submitted',
  'validated',
  'needs_revision',
])

export type ActivitySubmissionStatus = z.infer<
  typeof activitySubmissionStatusSchema
>

export const activityEvaluationResultStatusSchema = z.enum([
  'pass',
  'revise',
  'error',
])

export type ActivityEvaluationResultStatus = z.infer<
  typeof activityEvaluationResultStatusSchema
>

export const activityFieldSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(200),
    placeholder: z.string().trim().max(500).optional(),
    required: z.boolean().default(true),
    multiline: z.boolean().default(false),
  })
  .strict()

export type ActivityField = z.infer<typeof activityFieldSchema>

export const activityChecklistItemSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(300),
    description: z.string().trim().max(500).optional(),
    required: z.boolean().default(true),
  })
  .strict()

export type ActivityChecklistItem = z.infer<typeof activityChecklistItemSchema>

export const activityValidationRubricItemSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).optional(),
  })
  .strict()

export type ActivityValidationRubricItem = z.infer<
  typeof activityValidationRubricItemSchema
>

export const defaultActivityValidationConfig = {
  enabled: false,
  requiredForCompletion: false,
  rubric: [],
} satisfies {
  enabled: boolean
  requiredForCompletion: boolean
  rubric: ActivityValidationRubricItem[]
}

export const activityValidationConfigSchema = z
  .object({
    enabled: z.boolean().default(defaultActivityValidationConfig.enabled),
    requiredForCompletion: z
      .boolean()
      .default(defaultActivityValidationConfig.requiredForCompletion),
    rubric: z
      .array(activityValidationRubricItemSchema)
      .default(defaultActivityValidationConfig.rubric),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.requiredForCompletion && !value.enabled) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'requiredForCompletion solo puede ser true cuando la validacion esta habilitada',
        path: ['requiredForCompletion'],
      })
    }
  })

export type ActivityValidationConfig = z.infer<
  typeof activityValidationConfigSchema
>

const commonTextSubmissionSchema = z
  .object({
    responsePlaceholder: z.string().trim().max(500).optional(),
    evidencePlaceholder: z.string().trim().max(500).optional(),
    requireEvidence: z.boolean().default(false),
    maxLength: z.number().int().positive().max(20000).optional(),
  })
  .strict()

export const activityToolTaskSchema = z
  .object({
    toolKey: z.enum(supportedExternalToolKeys),
    promptTemplate: z.string().trim().max(12000).default(''),
    openInNewTab: z.boolean().default(true),
    showCopyButton: z.boolean().default(true),
  })
  .strict()

export type ActivityToolTask = z.infer<typeof activityToolTaskSchema>

const longTextActivityConfigSchema = z
  .object({
    interactionType: z.literal('long_text'),
    submission: commonTextSubmissionSchema.default({}),
    validation: activityValidationConfigSchema.default(
      defaultActivityValidationConfig,
    ),
    toolTask: activityToolTaskSchema.optional(),
  })
  .strict()

const inlineAnswersActivityConfigSchema = z
  .object({
    interactionType: z.literal('inline_answers'),
    submission: commonTextSubmissionSchema
      .extend({
        fields: z.array(activityFieldSchema).min(1),
      })
      .strict(),
    validation: activityValidationConfigSchema.default(
      defaultActivityValidationConfig,
    ),
    toolTask: activityToolTaskSchema.optional(),
  })
  .strict()

const checklistActivityConfigSchema = z
  .object({
    interactionType: z.literal('checklist'),
    submission: z
      .object({
        checklistItems: z.array(activityChecklistItemSchema).min(1),
        responsePlaceholder: z.string().trim().max(500).optional(),
        evidencePlaceholder: z.string().trim().max(500).optional(),
        requireEvidence: z.boolean().default(false),
      })
      .strict(),
    validation: activityValidationConfigSchema.default(
      defaultActivityValidationConfig,
    ),
    toolTask: activityToolTaskSchema.optional(),
  })
  .strict()

const externalToolTaskActivityConfigSchema = z
  .object({
    interactionType: z.literal('external_tool_task'),
    submission: commonTextSubmissionSchema.default({}),
    validation: activityValidationConfigSchema.default(
      defaultActivityValidationConfig,
    ),
    toolTask: activityToolTaskSchema,
  })
  .strict()

export const activityConfigSchema = z.discriminatedUnion('interactionType', [
  longTextActivityConfigSchema,
  inlineAnswersActivityConfigSchema,
  checklistActivityConfigSchema,
  externalToolTaskActivityConfigSchema,
])

export type ActivityConfig = z.infer<typeof activityConfigSchema>
export type ActivityInteractionType = ActivityConfig['interactionType']

const unknownRecordSchema = z.record(z.string(), z.unknown())

export const activitySubmissionRequestSchema = z
  .object({
    status: z.enum(['draft', 'submitted']).default('draft'),
    responseText: z.string().max(20000).nullable().optional(),
    responsePayload: unknownRecordSchema.default({}),
    evidencePayload: unknownRecordSchema.nullable().optional(),
  })
  .strict()

export type ActivitySubmissionRequest = z.infer<
  typeof activitySubmissionRequestSchema
>

export const activityValidationRequestSchema = z
  .object({
    responseText: z.string().max(20000).nullable().optional(),
    responsePayload: unknownRecordSchema.optional(),
    evidencePayload: unknownRecordSchema.nullable().optional(),
  })
  .strict()
  .partial()

export type ActivityValidationRequest = z.infer<
  typeof activityValidationRequestSchema
>

export const activityEvaluationFeedbackSchema = z
  .object({
    resultStatus: activityEvaluationResultStatusSchema,
    summary: z.string().trim().min(1).max(4000),
    strengths: z.array(z.string().trim().min(1).max(500)).default([]),
    improvements: z.array(z.string().trim().min(1).max(500)).default([]),
    suggestedNextStep: z.string().trim().min(1).max(1000),
  })
  .strict()

export type ActivityEvaluationFeedback = z.infer<
  typeof activityEvaluationFeedbackSchema
>

export interface ActivityEvaluationRecord {
  evaluationId: string
  resultStatus: ActivityEvaluationResultStatus
  createdAt: string
  feedback: ActivityEvaluationFeedback | null
}

export interface ActivitySubmissionSummary {
  submissionId: string
  status: ActivitySubmissionStatus
  completionSatisfied: boolean
  submittedAt: string | null
  lastValidatedAt: string | null
  updatedAt: string | null
  latestEvaluation: ActivityEvaluationRecord | null
}

export interface ActivitySubmissionDetail extends ActivitySubmissionSummary {
  responseText: string | null
  responsePayload: Record<string, unknown>
  evidencePayload: Record<string, unknown> | null
}

export function isSupportedExternalToolKey(
  value: unknown,
): value is ExternalToolKey {
  return (
    typeof value === 'string' &&
    supportedExternalToolKeys.includes(value as ExternalToolKey)
  )
}

export function normalizeActivityConfig(rawValue: unknown): ActivityConfig | null {
  const parsed = activityConfigSchema.safeParse(rawValue)
  return parsed.success ? parsed.data : null
}

export function normalizeActivityEvaluationFeedback(
  rawValue: unknown,
): ActivityEvaluationFeedback | null {
  const parsed = activityEvaluationFeedbackSchema.safeParse(rawValue)
  return parsed.success ? parsed.data : null
}
