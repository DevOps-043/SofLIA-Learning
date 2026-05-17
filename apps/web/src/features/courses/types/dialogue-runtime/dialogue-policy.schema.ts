import { z } from 'zod'
import { dialogueHintSchema } from './dialogue-config-parts.schema'
import { dialogueStateSchema } from './dialogue-states'

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
