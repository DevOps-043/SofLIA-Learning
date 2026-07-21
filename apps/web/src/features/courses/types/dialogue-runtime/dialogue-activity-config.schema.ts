import { z } from 'zod'
import {
  dialogueContextAdaptationSchema,
  dialogueCriterionSchema,
  dialogueHintSchema,
  dialogueRubricDimensionSchema,
} from './dialogue-config-parts.schema'
import { dialogueRuntimeType } from './dialogue-states'

export const dialogueActivityConfigSchema = z
  .object({
    interactionType: z.literal('soflia_dialogue'),
    runtimeType: z.literal(dialogueRuntimeType).default(dialogueRuntimeType),
    schemaVersion: z.string().trim().min(1).max(40).default('1.0.0'),
    title: z.string().trim().min(1).max(240).optional(),
    visibleGoal: z.string().trim().min(1).max(1000),
    learningObjective: z.string().trim().min(1).max(1200).optional(),
    scenario: z.string().trim().min(1).max(2000),
    openingMessage: z.string().trim().min(1).max(1200),
    studentRole: z.string().trim().max(300).optional(),
    sofliaRole: z.string().trim().max(500).optional(),
    successCriteria: z.array(dialogueCriterionSchema).min(1).max(12),
    expectedEvidence: z.array(z.string().trim().min(1).max(600)).default([]),
    commonMistakes: z.array(z.string().trim().min(1).max(600)).default([]),
    hintLadder: z.array(dialogueHintSchema).default([]),
    challengePrompts: z.array(z.string().trim().min(1).max(600)).default([]),
    contextAdaptation: dialogueContextAdaptationSchema,
    rescueContent: z.string().trim().min(1).max(2500),
    rubric: z.array(dialogueRubricDimensionSchema).min(1).max(12),
    policy: z
      .object({
        // El gate de aprobación es autoritativo y fijo en 60% (ver
        // SOFLIA_DIALOGUE_APPROVAL_MINIMUM). Este default solo mantiene la config
        // consistente para nuevas actividades; el runtime no baja de 60.
        approvalMinimum: z.number().min(0).max(100).default(60),
        maxTurns: z.number().int().min(1).max(30).default(8),
        maxHints: z.number().int().min(0).max(6).default(2),
        rescueAfterLowEvidenceTurns: z.number().int().min(1).max(10).default(2),
        allowRetry: z.boolean().default(true),
      })
      .strict()
      .default({}),
    tutor: z
      .object({
        tone: z.string().trim().max(80).default('direct_supportive'),
        maxResponseSentences: z.number().int().min(1).max(8).default(4),
      })
      .strict()
      .default({}),
    evaluator: z
      .object({
        model: z.string().trim().max(120).optional(),
        promptVersion: z.string().trim().max(120).default('DIALOGUE_EVALUATOR_RUNTIME@1.1.0'),
      })
      .strict()
      .default({}),
    analytics: z
      .object({
        trackEvents: z.array(z.string().trim().min(1).max(100)).default([]),
      })
      .strict()
      .default({}),
    versioning: z
      .object({
        materialVersion: z.string().trim().max(80).optional(),
        rubricVersion: z.string().trim().max(80).default('1.0.0'),
        promptVersion: z.string().trim().max(120).optional(),
      })
      .strict()
      .default({}),
  })
  .strict()

export type DialogueActivityConfig = z.infer<typeof dialogueActivityConfigSchema>

export function isDialogueActivityConfig(value: unknown): value is DialogueActivityConfig {
  return dialogueActivityConfigSchema.safeParse(value).success
}
