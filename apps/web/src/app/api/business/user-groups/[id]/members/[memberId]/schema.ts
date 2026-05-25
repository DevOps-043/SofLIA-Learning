import { z } from 'zod'

export const userGroupMemberUpdateSchema = z.object({
  role: z.enum(['leader', 'member']),
})

export type UserGroupMemberUpdateBody = z.infer<
  typeof userGroupMemberUpdateSchema
>
