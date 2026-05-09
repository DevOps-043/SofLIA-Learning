import { ZodError } from 'zod'

import { validateInvitationSchema } from './schemas'
import {
  getBulkInviteStateCheck,
  getInvitationPosition,
  isExpired,
  normalizeEmail,
  resolveInvitationRole,
} from './shared'
import { getInvitationStatusError } from './utils'
import type {
  BulkInviteValidationResult,
  FindInvitationResult,
  InvitationRepository,
  InvitationRuntime,
  ValidateResult,
} from './types'

export async function findInvitationByEmail(
  email: string,
  organizationId: string,
  runtime: InvitationRuntime
): Promise<FindInvitationResult> {
  try {
    const invitation = await runtime.repo.findPendingInvitationByEmail(
      normalizeEmail(email),
      organizationId
    )

    if (!invitation) {
      return { hasInvitation: false }
    }

    if (isExpired(invitation.expiresAt, runtime.now())) {
      await runtime.repo.markInvitationExpired(invitation.id)
      return { hasInvitation: false, error: 'La invitacion ha expirado' }
    }

    return {
      hasInvitation: true,
      position: getInvitationPosition(invitation.metadata),
      role: invitation.role,
    }
  } catch (error) {
    runtime.logger.error('Error in findInvitationByEmailAction:', error)
    return { hasInvitation: false, error: 'Error buscando invitacion' }
  }
}

export async function validateInvitation(
  token: string,
  runtime: InvitationRuntime
): Promise<ValidateResult> {
  try {
    const parsed = validateInvitationSchema.parse({ token })
    const invitation = await runtime.repo.getInvitationByToken(parsed.token)

    if (!invitation) {
      return { valid: false, error: 'Invitacion no encontrada' }
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: getInvitationStatusError(invitation.status) }
    }

    if (isExpired(invitation.expiresAt, runtime.now())) {
      await runtime.repo.markInvitationExpired(invitation.id)
      return { valid: false, error: 'Esta invitacion ha expirado' }
    }

    const existingUser = await runtime.repo.findUserByEmail(invitation.email)

    return {
      accountExists: Boolean(existingUser),
      email: invitation.email,
      organizationId: invitation.organizationId,
      organizationName: invitation.organization?.name ?? undefined,
      organizationSlug: invitation.organization?.slug ?? undefined,
      position: getInvitationPosition(invitation.metadata),
      role: invitation.role,
      valid: true,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { valid: false, error: 'Token invalido' }
    }

    runtime.logger.error('Error in validateInvitationAction:', error)
    return { valid: false, error: 'Error validando invitacion' }
  }
}

export async function validateInvitationToken(
  repository: InvitationRepository,
  token: string,
  now: Date = new Date()
): Promise<ValidateResult> {
  return validateInvitation(token, {
    createToken: () => '',
    emailService: {
      async sendOrganizationInvitationEmail() {
        return undefined
      },
    },
    logger: {
      error() {},
      info() {},
      warn() {},
    },
    now: () => now,
    repo: repository,
  })
}

export async function validateBulkInviteRegistration(
  repository: InvitationRepository,
  token: string,
  organizationId: string,
  now: Date = new Date()
): Promise<BulkInviteValidationResult> {
  const link = await repository.getBulkInviteLinkByToken(token)

  if (!link || link.organizationId !== organizationId) {
    return {
      valid: false,
      error: 'Enlace de invitacion invalido o expirado',
    }
  }

  const state = getBulkInviteStateCheck(link, now)

  if (!state.valid) {
    if ('statusToPersist' in state && state.statusToPersist) {
      await repository.markBulkInviteLinkStatus(link.id, state.statusToPersist)
    }

    return {
      valid: false,
      error: state.error,
    }
  }

  return {
    role: resolveInvitationRole(link.role),
    valid: true,
  }
}
