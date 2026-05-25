import { z } from 'zod'

export const joinRequestActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

export type JoinRequestActionBody = z.infer<typeof joinRequestActionSchema>
