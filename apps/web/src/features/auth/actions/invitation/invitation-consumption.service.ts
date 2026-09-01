import { getInvitationPosition, isInvitationToken } from './shared'
import type { ConsumeResult, InvitationRuntime } from './types'

export { consumeBulkInvitation } from './bulk-invitation-consumption.service'

export async function consumeInvitation(
  tokenOrEmail: string,
  organizationId: string,
  userId: string,
  runtime: InvitationRuntime,
): Promise<ConsumeResult> {
  try {
    const authenticatedUserId = await runtime.repo.resolveAuthenticatedUserId()
    if (!authenticatedUserId) {
      runtime.logger.warn(
        'consumeInvitationAction called without a valid session',
      )
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesion.',
      }
    }
    if (authenticatedUserId !== userId) {
      runtime.logger.error('consumeInvitationAction user mismatch', {
        requestedUser: userId,
        sessionUser: authenticatedUserId,
      })
      return { success: false, error: 'No autorizado.' }
    }

    return completeInvitationConsumption(
      tokenOrEmail,
      organizationId,
      userId,
      runtime,
    )
  } catch (error) {
    runtime.logger.error('Error in consumeInvitationAction:', error)
    return { success: false, error: 'Error consumiendo invitacion' }
  }
}

/**
 * Trusted registration-only path. The user id comes from the account that was
 * provisioned in the same server action, before that user has a browser session.
 */
export async function consumeProvisionedUserInvitation(
  tokenOrEmail: string,
  organizationId: string,
  userId: string,
  runtime: InvitationRuntime,
): Promise<ConsumeResult> {
  try {
    return completeInvitationConsumption(
      tokenOrEmail,
      organizationId,
      userId,
      runtime,
    )
  } catch (error) {
    runtime.logger.error('Error consuming provisioned-user invitation:', error)
    return { success: false, error: 'Error consumiendo invitacion' }
  }
}

async function completeInvitationConsumption(
  tokenOrEmail: string,
  organizationId: string,
  userId: string,
  runtime: InvitationRuntime,
): Promise<ConsumeResult> {
  const invitation = await runtime.repo.getInvitationForConsume(
    tokenOrEmail,
    organizationId,
    isInvitationToken(tokenOrEmail),
  )

  if (!invitation) {
    runtime.logger.warn('Invitation not found during consume', {
      organizationId,
      lookupType: isInvitationToken(tokenOrEmail) ? 'token' : 'email',
    })
    return { success: true }
  }

  const existingMember = await runtime.repo.findOrganizationMembership(
    userId,
    organizationId,
  )
  if (!existingMember) {
    await runtime.repo.addOrganizationMembership({
      jobTitle: getInvitationPosition(invitation.metadata),
      joinedAt: runtime.now().toISOString(),
      organizationId,
      role: invitation.role || 'member',
      status: 'active',
      userId,
    })
    await runtime.repo.setUserBusinessRole(userId)
  }

  await runtime.repo.acceptInvitation(
    invitation.id,
    runtime.now().toISOString(),
  )

  runtime.logger.info('Invitation consumed successfully', {
    invitationId: invitation.id,
    organizationId,
    userId,
  })

  return { success: true }
}
