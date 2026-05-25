import { z } from 'zod'

export const tourProgressSchema = z.object({
  tourId: z.string().min(1).max(120),
  action: z.enum(['start', 'step', 'complete', 'skip']),
  stepReached: z.number().int().min(0).max(1_000).optional(),
})

export type TourProgressBody = z.infer<typeof tourProgressSchema>
