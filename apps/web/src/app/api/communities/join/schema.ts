import { z } from 'zod'

export const joinCommunitySchema = z.object({
  communityId: z.string().uuid(),
})

export type JoinCommunityBody = z.infer<typeof joinCommunitySchema>
