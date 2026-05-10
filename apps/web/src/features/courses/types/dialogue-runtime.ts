import { z } from 'zod'

export const dialogueRuntimeType = 'SOFLIA_DIALOGUE' as const

export const dialogueStateSchema = z.enum([
  'START',
  'ELICIT_RESPONSE',
  'EVALUATE_RESPONSE',
  'CHALLENGE_OR_PROBE',
  'HINT',
  'RESCUE',
  'COMPLETE',
  'FAIL_OR_RETRY',
  'SESSION_SUMMARY',
])

export type DialogueState = z.infer<typeof dialogueStateSchema>

export const terminalDialogueStates: DialogueState[] = [
  'COMPLETE',
  'FAIL_OR_RETRY',
  'SESSION_SUMMARY',
]

const dialogueCriterionSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(240),
    description: z.string().trim().max(1000).optional(),
    required: z.boolean().default(true),
  })
  .strict()

const dialogueRubricDimensionSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(240),
    description: z.string().trim().max(1200).optional(),
    weight: z.number().min(0).max(100).default(20),
  })
  .strict()

const dialogueHintSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    level: z.number().int().min(1).max(5),
    content: z.string().trim().min(1).max(1200),
    targetCriterionId: z.string().trim().max(100).optional(),
  })
  .strict()

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
    rescueContent: z.string().trim().min(1).max(2500),
    rubric: z.array(dialogueRubricDimensionSchema).min(1).max(12),
    policy: z
      .object({
        approvalMinimum: z.number().min(0).max(100).default(75),
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
        promptVersion: z.string().trim().max(120).default('DIALOGUE_EVALUATOR_RUNTIME@1.0.0'),
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

export const dialogueMessageRequestSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(6000),
    clientTurnId: z.string().trim().min(1).max(120).optional(),
  })
  .strict()

export type DialogueMessageRequest = z.infer<typeof dialogueMessageRequestSchema>

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

export const dialoguePolicyDecisionSchema = z
  .object({
    nextState: dialogueStateSchema,
    nextAction: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(800),
    shouldComplete: z.boolean(),
    shouldPersistResult: z.boolean(),
    hintToUse: dialogueHintSchema.nullable().default(null),
  })
  .strict()

export type DialoguePolicyDecision = z.infer<typeof dialoguePolicyDecisionSchema>

export const dialogueSessionResultSchema = z
  .object({
    activityResult: z.enum(['completed', 'needs_retry']),
    score: z.number().min(0).max(100),
    studentFeedback: z.string().trim().min(1).max(2000),
    instructorSummary: z.string().trim().max(3000).default(''),
    criteriaMet: z.array(z.string()).default([]),
    criteriaMissing: z.array(z.string()).default([]),
    evidenceQuotes: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
    analyticsTags: z.array(z.string()).default([]),
  })
  .strict()

export type DialogueSessionResult = z.infer<typeof dialogueSessionResultSchema>

export function isDialogueActivityConfig(
  value: unknown,
): value is DialogueActivityConfig {
  return dialogueActivityConfigSchema.safeParse(value).success
}

export function isTerminalDialogueState(state: DialogueState) {
  return terminalDialogueStates.includes(state)
}
