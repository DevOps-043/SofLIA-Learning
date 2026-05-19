import { z } from 'zod'

export const userGroupMemberCreateSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['leader', 'member']).optional(),
})

export type UserGroupMemberCreateBody = z.infer<
  typeof userGroupMemberCreateSchema
>
