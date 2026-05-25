import { getInvitationPosition, isInvitationToken } from './shared'
import type { ConsumeResult, InvitationRuntime } from './types'

export { consumeBulkInvitation } from './bulk-invitation-consumption.service'

export async function consumeInvitation(
  tokenOrEmail: string,
  organizationId: string,
  userId: string,
  runtime: InvitationRuntime
): Promise<ConsumeResult> {
  try {
    const invitation = await runtime.repo.getInvitationForConsume(
      tokenOrEmail,
      organizationId,
      isInvitationToken(tokenOrEmail)
    )

    if (!invitation) {
      runtime.logger.warn('Invitation not found during consume', {
        organizationId,
        tokenOrEmail,
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

    await runtime.repo.acceptInvitation(invitation.id, runtime.now().toISOString())

    runtime.logger.info('Invitation consumed successfully', {
      invitationId: invitation.id,
      organizationId,
      userId,
    })

    return { success: true }
  } catch (error) {
    runtime.logger.error('Error in consumeInvitationAction:', error)
    return { success: false, error: 'Error consumiendo invitacion' }
  }
}
