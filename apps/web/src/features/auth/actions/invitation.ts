'use server'

import { ZodError } from 'zod'

import {
  consumeBulkInvitation,
  consumeInvitation,
  createInvitationRuntime,
  findInvitationByEmail,
  inviteUser,
  listOrganizationInvitations,
  resendInvitation,
  revokeInvitation,
  validateInvitation,
  type ConsumeResult,
  type FindInvitationResult,
  type InviteResult,
  type InvitationRole,
  type InvitationStatus,
  type InviteUserInput,
  type ListOrganizationInvitationsResult,
  type ValidateResult,
} from './invitation/index'
import {
  validateInvitationSchema,
} from './invitation/schemas'

export type {
  ConsumeResult,
  FindInvitationResult,
  InviteResult,
  InvitationRole,
  InvitationStatus,
  InviteUserInput,
  ListOrganizationInvitationsResult,
  ValidateResult,
}

export async function inviteUserAction(
  input: InviteUserInput | FormData
): Promise<InviteResult> {
  return inviteUser(input, await createInvitationRuntime())
}

export async function validateInvitationAction(
  token: string
): Promise<ValidateResult> {
  try {
    const parsed = validateInvitationSchema.parse({ token })
    return validateInvitation(parsed.token, await createInvitationRuntime())
  } catch (error) {
    if (error instanceof ZodError) {
      return { valid: false, error: 'Token invalido' }
    }

    return { valid: false, error: 'Error validando invitacion' }
  }
}

export async function consumeInvitationAction(
  tokenOrEmail: string,
  organizationId: string,
  userId: string
): Promise<ConsumeResult> {
  return consumeInvitation(
    tokenOrEmail,
    organizationId,
    userId,
    await createInvitationRuntime()
  )
}

export async function findInvitationByEmailAction(
  email: string,
  organizationId: string
): Promise<FindInvitationResult> {
  return findInvitationByEmail(email, organizationId, await createInvitationRuntime())
}

export async function revokeInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  return revokeInvitation(invitationId, await createInvitationRuntime())
}

export async function listOrganizationInvitationsAction(
  organizationId: string,
  status?: InvitationStatus
): Promise<ListOrganizationInvitationsResult> {
  return listOrganizationInvitations(
    organizationId,
    status,
    await createInvitationRuntime()
  )
}

export async function resendInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  return resendInvitation(invitationId, await createInvitationRuntime())
}

export async function consumeBulkInvitationAction(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; organizationSlug?: string }> {
  try {
    const parsed = validateInvitationSchema.parse({ token })
    return consumeBulkInvitation(parsed.token, userId, await createInvitationRuntime())
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: 'Token invalido' }
    }

    return { success: false, error: 'Error procesando invitacion' }
  }
}
