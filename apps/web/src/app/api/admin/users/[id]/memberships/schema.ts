import { z } from 'zod'

export const AddUserMembershipSchema = z
  .object({
    organizationId: z.string().uuid(),
    role: z.enum(['member', 'admin', 'owner']).default('member'),
    jobTitle: z.string().trim().max(120).optional().nullable(),
  })
  .strict()

export type AddUserMembershipBody = z.infer<typeof AddUserMembershipSchema>
