import { z } from 'zod'

export const dialogueMessageRequestSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(6000),
    clientTurnId: z.string().trim().min(1).max(120).optional(),
  })
  .strict()

export type DialogueMessageRequest = z.infer<typeof dialogueMessageRequestSchema>
