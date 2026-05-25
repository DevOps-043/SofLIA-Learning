import { z } from 'zod'

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
