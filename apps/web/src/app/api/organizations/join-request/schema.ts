import { z } from 'zod'

export const joinRequestSchema = z.object({
  slug: z.string().min(1).max(160),
  message: z.string().max(2_000).optional().nullable(),
  job_title: z.string().max(200).optional().nullable(),
})

export type JoinRequestBody = z.infer<typeof joinRequestSchema>
