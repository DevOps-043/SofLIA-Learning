import type {
  CreateBusinessUserRequest,
} from '@/features/business-panel/services/businessUsers.service'
import type { ShowBusinessUsersToast } from './types'

interface UseBusinessUsersPrimaryActionsParams {
  createUser: (userData: CreateBusinessUserRequest) => Promise<void>
  resendInvitation: (id: string) => Promise<void>
  suspendUser: (id: string) => Promise<void>
  activateUser: (id: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  updateInviteLinkStatus: (id: string, action: 'pause' | 'resume') => Promise<void>
  deleteInviteLink: (id: string) => Promise<void>
  showToast: ShowBusinessUsersToast
  setIsAddModalOpen: (isOpen: boolean) => void
  setIsDeleteModalOpen: (isOpen: boolean) => void
  setDeletingUser: (user: null) => void
}

export function useBusinessUsersPrimaryActions({
  createUser,
  resendInvitation: originalResendInvitation,
  suspendUser: originalSuspendUser,
  activateUser: originalActivateUser,
  deleteUser: originalDeleteUser,
  updateInviteLinkStatus: originalUpdateInviteLinkStatus,
  deleteInviteLink: originalDeleteInviteLink,
  showToast,
  setIsAddModalOpen,
  setIsDeleteModalOpen,
  setDeletingUser,
}: UseBusinessUsersPrimaryActionsParams) {
  const handleSaveNewUser = async (userData: CreateBusinessUserRequest) => {
    try {
      await createUser(userData); showToast('Usuario creado con éxito', 'success'); setIsAddModalOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear usuario', 'error')
    }
  }
  const resendInvitation = async (id: string) => {
    try {
      await originalResendInvitation(id); showToast('Invitación reenviada con éxito', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al reenviar invitación', 'error')
    }
  }
  const suspendUser = async (id: string) => {
    try {
      await originalSuspendUser(id); showToast('Usuario suspendido', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al suspender usuario', 'error')
    }
  }
  const activateUser = async (id: string) => {
    try {
      await originalActivateUser(id); showToast('Usuario activado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al activar usuario', 'error')
    }
  }
  const deleteUser = async (id: string) => {
    try {
      await originalDeleteUser(id); showToast('Usuario eliminado con éxito', 'success')
      setIsDeleteModalOpen(false); setDeletingUser(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar usuario', 'error')
    }
  }
  const updateInviteLinkStatus = async (id: string, action: 'pause' | 'resume') => {
    try {
      await originalUpdateInviteLinkStatus(id, action)
      showToast(action === 'pause' ? 'Enlace pausado' : 'Enlace reactivado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar enlace', 'error')
    }
  }
  const deleteInviteLink = async (id: string) => {
    try {
      await originalDeleteInviteLink(id); showToast('Enlace eliminado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar enlace', 'error')
    }
  }

  return { handleSaveNewUser, resendInvitation, suspendUser, activateUser, deleteUser, updateInviteLinkStatus, deleteInviteLink }
}
