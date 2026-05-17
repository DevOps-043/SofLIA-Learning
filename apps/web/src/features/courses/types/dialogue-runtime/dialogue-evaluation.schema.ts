import { z } from 'zod'
import { dialogueStateSchema } from './dialogue-states'

export const dialogueDimensionScoreSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    score: z.number().min(0).max(100),
    rationale: z.string().trim().max(800).default(''),
  })
  .strict()

export const dialogueEvaluationResultSchema = z
  .object({
    overallScore: z.number().min(0).max(100),
    decision: z.enum([
      'complete',
      'partial_continue',
      'needs_hint',
      'low_evidence',
      'rescue',
      'fail_or_retry',
      'security_block',
    ]),
    recommendedNextState: dialogueStateSchema,
    dimensionScores: z.array(dialogueDimensionScoreSchema).default([]),
    criteriaMet: z.array(z.string().trim().min(1).max(100)).default([]),
    criteriaMissing: z.array(z.string().trim().min(1).max(100)).default([]),
    flags: z
      .object({
        keywordStuffing: z.boolean().default(false),
        promptInjection: z.boolean().default(false),
        evasiveAnswer: z.boolean().default(false),
        contradiction: z.boolean().default(false),
        memorizedWithoutLogic: z.boolean().default(false),
      })
      .strict()
      .default({}),
    feedbackForTutor: z.string().trim().max(1200).default(''),
    backendNotes: z.string().trim().max(1200).default(''),
    evidenceQuotes: z.array(z.string().trim().min(1).max(400)).default([]),
  })
  .strict()

export type DialogueEvaluationResult = z.infer<typeof dialogueEvaluationResultSchema>
