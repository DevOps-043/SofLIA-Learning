import { z } from 'zod'

export const invitationRoles = ['owner', 'admin', 'member'] as const

export type InvitationRole = (typeof invitationRoles)[number]
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export const inviteUserSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(invitationRoles).default('member'),
  organizationId: z.string().uuid('ID de organizacion invalido'),
  customMessage: z.string().max(500).optional(),
  position: z.string().max(100).optional(),
})

export const validateInvitationSchema = z.object({
  token: z.string().min(64, 'Token invalido').max(64, 'Token invalido'),
})
