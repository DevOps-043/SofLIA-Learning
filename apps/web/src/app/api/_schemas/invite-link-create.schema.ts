import { z } from 'zod'

const inviteLinkRoleSchema = z.enum(['member', 'admin', 'owner'])

export const inviteLinkCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional().nullable(),
    maxUses: z.number().int().min(1).max(10_000),
    role: inviteLinkRoleSchema,
    expiresAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'expiresAt must be a valid date string',
      })
      .refine((value) => new Date(value) > new Date(), {
        message: 'expiresAt must be in the future',
      }),
  })
  .strict()

export type InviteLinkCreateBody = z.infer<typeof inviteLinkCreateSchema>

export interface BulkInviteLinkInsert {
  organization_id: string
  created_by: string
  token: string
  name: string | null
  max_uses: number
  role: 'member' | 'admin' | 'owner'
  expires_at: string
  status: 'active'
}

export interface BulkInviteLinkRow extends BulkInviteLinkInsert {
  id: string
  current_uses?: number | null
  created_at?: string | null
  updated_at?: string | null
}
