import { buildInvitationExpiry } from './shared'
import { mapOrganizationInvitationListItem } from './utils'
import type {
  InvitationRuntime,
  InvitationStatus,
  ListOrganizationInvitationsResult,
} from './types'

export async function listOrganizationInvitations(
  organizationId: string,
  status: InvitationStatus | undefined,
  runtime: InvitationRuntime,
): Promise<ListOrganizationInvitationsResult> {
  try {
    const authorization =
      await runtime.authorizeOrganizationAdmin(organizationId)
    if (!authorization) {
      return { success: false, error: 'No autorizado' }
    }

    const invitations = await runtime.repo.listOrganizationInvitations(
      organizationId,
      status,
    )

    return {
      invitations: invitations.map((invitation) =>
        mapOrganizationInvitationListItem({
          created_at: invitation.createdAt,
          email: invitation.email,
          expires_at: invitation.expiresAt,
          id: invitation.id,
          metadata: invitation.metadata,
          role: invitation.role,
          status: invitation.status,
        }),
      ),
      success: true,
    }
  } catch (error) {
    runtime.logger.error('Error in listOrganizationInvitationsAction:', error)
    return { success: false, error: 'Error listando invitaciones' }
  }
}

export async function resendInvitation(
  invitationId: string,
  runtime: InvitationRuntime,
): Promise<{ success: boolean; error?: string }> {
  try {
    const invitation = await runtime.repo.getInvitationById(invitationId)

    if (!invitation) {
      return { success: false, error: 'Invitacion no encontrada' }
    }

    const authorization = await runtime.authorizeOrganizationAdmin(
      invitation.organizationId,
    )
    if (!authorization) {
      return { success: false, error: 'No autorizado' }
    }

    if (invitation.status !== 'pending') {
      return {
        success: false,
        error: 'Solo se pueden reenviar invitaciones pendientes',
      }
    }

    const newToken = runtime.createToken()
    const newExpiry = buildInvitationExpiry(runtime.now())

    await runtime.repo.refreshInvitation(invitationId, newToken, newExpiry)

    try {
      await runtime.emailService.sendOrganizationInvitationEmail(
        invitation.email,
        newToken,
        invitation.organization?.name ?? 'Organizacion',
        invitation.organization?.slug ?? '',
        invitation.metadata?.custom_message ?? undefined,
        invitation.organization?.logoUrl ?? undefined,
      )
    } catch (emailError) {
      runtime.logger.error('Error resending invitation email:', emailError)
      await runtime.repo.refreshInvitation(
        invitationId,
        invitation.token,
        invitation.expiresAt,
      )
      return { success: false, error: 'Error enviando email' }
    }

    return { success: true }
  } catch (error) {
    runtime.logger.error('Error in resendInvitationAction:', error)
    return { success: false, error: 'Error reenviando invitacion' }
  }
}

export async function revokeInvitation(
  invitationId: string,
  runtime: InvitationRuntime,
): Promise<{ success: boolean; error?: string }> {
  try {
    const invitation = await runtime.repo.getInvitationById(invitationId)
    if (!invitation) {
      return { success: false, error: 'Invitacion no encontrada' }
    }

    const authorization = await runtime.authorizeOrganizationAdmin(
      invitation.organizationId,
    )
    if (!authorization) {
      return { success: false, error: 'No autorizado' }
    }

    await runtime.repo.revokePendingInvitation(invitationId)
    return { success: true }
  } catch (error) {
    runtime.logger.error('Error in revokeInvitationAction:', error)
    return { success: false, error: 'Error revocando invitacion' }
  }
}
