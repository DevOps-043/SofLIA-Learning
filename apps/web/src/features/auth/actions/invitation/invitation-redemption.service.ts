import { getBulkInviteStateCheck } from './shared'
import type {
  BulkInviteLinkRecord,
  ConsumeResult,
  InvitationRepository,
} from './types'

async function reserveBulkInviteRegistration(
  repository: InvitationRepository,
  token: string,
  link: BulkInviteLinkRecord,
  userId: string,
  now: Date
): Promise<ConsumeResult> {
  const nextUses = (link.currentUses ?? 0) + 1
  const nextStatus =
    link.maxUses !== null && nextUses >= link.maxUses ? 'exhausted' : undefined

  const usageReserved = await repository.reserveBulkInviteUse(
    link.id,
    link.currentUses,
    nextUses,
    nextStatus
  )

  if (!usageReserved) {
    const latestLink = await repository.getBulkInviteLinkByToken(token)

    if (latestLink) {
      const latestState = getBulkInviteStateCheck(latestLink, now)

      if (!latestState.valid) {
        if ('statusToPersist' in latestState && latestState.statusToPersist) {
          await repository.markBulkInviteLinkStatus(
            latestLink.id,
            latestState.statusToPersist
          )
        }

        return {
          success: false,
          error: latestState.error,
        }
      }
    }

    return {
      success: false,
      error: 'No se pudo reservar el uso del enlace. Intenta de nuevo.',
    }
  }

  try {
    await repository.createBulkInviteRegistration(link.id, userId)
  } catch {
    return {
      success: false,
      error: 'Error registrando el uso del enlace',
    }
  }

  return { success: true }
}

export async function finalizeBulkInviteRegistration(
  repository: InvitationRepository,
  token: string,
  organizationId: string,
  userId: string,
  now: Date = new Date()
): Promise<ConsumeResult> {
  const link = await repository.getBulkInviteLinkByToken(token)

  if (!link || link.organizationId !== organizationId) {
    return {
      success: false,
      error: 'Enlace de invitacion invalido o expirado',
    }
  }

  const state = getBulkInviteStateCheck(link, now)
  if (!state.valid) {
    if ('statusToPersist' in state && state.statusToPersist) {
      await repository.markBulkInviteLinkStatus(link.id, state.statusToPersist)
    }

    return {
      success: false,
      error: state.error,
    }
  }

  return reserveBulkInviteRegistration(repository, token, link, userId, now)
}
