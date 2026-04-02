import { ZodError } from 'zod'

import { buildInvitationExpiry, normalizeEmail } from './shared'
import type {
  InviteResult,
  InviteUserActionInput,
  InvitationRuntime,
} from './types'
import { parseInviteUserInput } from './utils'

export async function inviteUser(
  input: InviteUserActionInput,
  runtime: InvitationRuntime
): Promise<InviteResult> {
  try {
    const data = parseInviteUserInput(input)
    const normalizedEmail = normalizeEmail(data.email)

    const existingUser = await runtime.repo.findUserByEmail(normalizedEmail)
    if (existingUser) {
      const orgUser = await runtime.repo.findOrganizationMembership(
        existingUser.id,
        data.organizationId
      )

      if (orgUser) {
        return {
          success: false,
          error: 'Este usuario ya pertenece a la organizacion',
        }
      }
    }

    const existingInvitation = await runtime.repo.findPendingInvitationByEmail(
      normalizedEmail,
      data.organizationId
    )

    if (existingInvitation) {
      return {
        success: false,
        error: 'Ya existe una invitacion pendiente para este email',
      }
    }

    const token = runtime.createToken()
    const invitation = await runtime.repo.createInvitation({
      email: normalizedEmail,
      expiresAt: buildInvitationExpiry(runtime.now()),
      metadata: {
        custom_message: data.customMessage ?? null,
        position: data.position ?? null,
      },
      organizationId: data.organizationId,
      role: data.role ?? 'member',
      token,
    })

    const organization = await runtime.repo.getOrganizationById(data.organizationId)

    try {
      await runtime.emailService.sendOrganizationInvitationEmail(
        data.email,
        token,
        organization?.name ?? 'Organizacion',
        organization?.slug ?? '',
        data.customMessage,
        organization?.logoUrl ?? undefined
      )

      runtime.logger.info('Invitation sent successfully', {
        email: data.email,
        invitationId: invitation.id,
        organizationId: data.organizationId,
      })
    } catch (emailError) {
      runtime.logger.error('Error sending invitation email:', emailError)
    }

    return {
      invitationId: invitation.id,
      success: true,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? 'Datos invalidos',
      }
    }

    runtime.logger.error('Error in inviteUserAction:', error)
    return { success: false, error: 'Error procesando invitacion' }
  }
}
