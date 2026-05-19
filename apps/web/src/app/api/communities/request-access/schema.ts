import { z } from 'zod'

export const requestCommunityAccessSchema = z.object({
  communityId: z.string().uuid(),
  note: z.string().max(2_000).optional().nullable(),
})

export type RequestCommunityAccessBody = z.infer<typeof requestCommunityAccessSchema>
