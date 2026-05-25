import { z } from 'zod'

export const processVideoSchema = z.object({
  videoUrl: z.string().url().max(2_000),
})

export type ProcessVideoBody = z.infer<typeof processVideoSchema>
