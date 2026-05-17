import type { ShowBusinessUsersToast } from './types'

interface UseBusinessUsersSecondaryActionsParams {
  orgSlug: string
  refetch: () => void
  reviewJoinRequest: (requestId: string, action: 'approve' | 'reject') => Promise<void>
  showToast: ShowBusinessUsersToast
}

export function useBusinessUsersSecondaryActions({
  orgSlug,
  refetch,
  reviewJoinRequest: originalReviewJoinRequest,
  showToast,
}: UseBusinessUsersSecondaryActionsParams) {
  const handleResendIndividualInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}/resend`, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        showToast('Invitación reenviada con éxito', 'success'); refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al reenviar invitación', 'error')
      }
    } catch {
      showToast('Error inesperado al reenviar invitación', 'error')
    }
  }
  const handleRevokeInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        showToast('Invitación revocada con éxito', 'success'); refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al revocar invitación', 'error')
      }
    } catch {
      showToast('Error inesperado al revocar invitación', 'error')
    }
  }
  const reviewJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await originalReviewJoinRequest(requestId, action)
      if (action === 'approve') { showToast('Solicitud aprobada con éxito', 'success'); refetch() }
      else showToast('Solicitud rechazada', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al procesar la solicitud', 'error')
    }
  }

  return { handleResendIndividualInvitation, handleRevokeInvitation, reviewJoinRequest }
}
