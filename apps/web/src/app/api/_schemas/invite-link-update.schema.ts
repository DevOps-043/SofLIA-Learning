import { z } from 'zod'

export const inviteLinkPatchSchema = z
  .object({
    action: z.enum(['pause', 'resume']).optional(),
    expiresAt: z.string().trim().min(1).optional(),
    maxUses: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict()

export type InviteLinkPatchBody = z.infer<typeof inviteLinkPatchSchema>

export type InviteLinkStatus = 'active' | 'paused' | 'expired' | 'exhausted'

export type InviteLinkUpdateData = {
  expires_at?: string
  max_uses?: number
  name?: string
  status?: InviteLinkStatus
}
