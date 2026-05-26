import { finalizeBulkInviteRegistration } from './invitation-redemption.service'
import { resolveInvitationRole } from './shared'
import type { InvitationRuntime } from './types'

export async function consumeBulkInvitation(
  token: string,
  userId: string,
  runtime: InvitationRuntime,
): Promise<{ success: boolean; error?: string; organizationSlug?: string }> {
  try {
    const authenticatedUserId = await runtime.repo.resolveAuthenticatedUserId()

    if (!authenticatedUserId) {
      runtime.logger.warn('consumeBulkInvitationAction called without a valid session')
      return { success: false, error: 'No autenticado. Por favor inicia sesion.' }
    }

    if (authenticatedUserId !== userId) {
      runtime.logger.error('consumeBulkInvitationAction user mismatch', {
        requestedUser: userId,
        sessionUser: authenticatedUserId,
      })
      return { success: false, error: 'No autorizado.' }
    }

    return await completeBulkInvitationConsumption(token, userId, runtime)
  } catch (error) {
    runtime.logger.error('Error in consumeBulkInvitationAction:', error)
    return { success: false, error: 'Error interno al procesar invitacion' }
  }
}

async function completeBulkInvitationConsumption(
  token: string,
  userId: string,
  runtime: InvitationRuntime,
): Promise<{ success: boolean; error?: string; organizationSlug?: string }> {
  const link = await runtime.repo.getBulkInviteLinkByToken(token)
  if (!link) {
    return { success: false, error: 'Enlace de invitacion no encontrado' }
  }

  const user = await runtime.repo.findUserById(userId)
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' }
  }

  const existingMember = await runtime.repo.findOrganizationMembership(userId, link.organizationId)
  if (existingMember) {
    return { success: false, error: 'Ya perteneces a esta organizacion' }
  }

  await runtime.repo.addOrganizationMembership({
    jobTitle: null,
    joinedAt: runtime.now().toISOString(),
    organizationId: link.organizationId,
    role: resolveInvitationRole(link.role),
    status: 'active',
    userId,
  })

  const usageResult = await finalizeBulkInviteRegistration(
    runtime.repo,
    token,
    link.organizationId,
    userId,
    runtime.now(),
  )

  if (!usageResult.success) {
    await runtime.repo.deleteOrganizationMembership(userId, link.organizationId)
    return usageResult
  }

  await runtime.repo.setUserBusinessRole(userId)
  const organizationSlug = await runtime.repo.getOrganizationSlug(link.organizationId)
  return { organizationSlug: organizationSlug ?? undefined, success: true }
}
