'use client'

import { useMemo, useState } from 'react'
import type { CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import type { UsersModalConfig, UsersSectionProps, CompanyUsersSubTab } from './types'
import { resendCompanyInvitation, revokeCompanyInvitation } from './users-section.actions'
import { filterInviteLinks, filterInvitations, filterMembers } from './users-section.helpers'

export function useUsersSectionState({ company, onUpdate }: UsersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeSubTab, setActiveSubTab] = useState<CompanyUsersSubTab>('members')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [manageMember, setManageMember] = useState<CompanyMember | null>(null)
  const [manageMode, setManageMode] = useState<'edit' | 'delete' | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)
  const [modalConfig, setModalConfig] = useState<UsersModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })
  const filteredMembers = useMemo(() => filterMembers(company, searchTerm, roleFilter), [company, roleFilter, searchTerm])
  const filteredInvitations = useMemo(() => filterInvitations(company, searchTerm), [company, searchTerm])
  const filteredLinks = useMemo(() => filterInviteLinks(company, searchTerm), [company, searchTerm])
  const showModal = (type: 'success' | 'error', title: string, message?: string) => setModalConfig({ isOpen: true, type, title, message })

  const handleResendInvitation = async (invitationId: string) => {
    setResendingId(invitationId)
    try {
      const result = await resendCompanyInvitation(invitationId)
      showModal(
        result.success ? 'success' : 'error',
        result.success ? '¡Éxito!' : 'Error',
        result.success ? 'Invitación reenviada con éxito' : result.error || 'No se pudo reenviar la invitación',
      )
    } catch (error) {
      console.error('Error resending invitation:', error)
      showModal('error', 'Error de conexión', 'Hubo un problema al intentar reenviar la invitación')
    } finally {
      setResendingId(null)
    }
  }

  const confirmRevokeInvitation = async () => {
    if (!invitationToRevoke) return
    const invitationId = invitationToRevoke
    setInvitationToRevoke(null)
    setRevokingId(invitationId)

    try {
      const result = await revokeCompanyInvitation(invitationId)
      if (result.success) onUpdate()
      showModal(
        result.success ? 'success' : 'error',
        result.success ? '¡Éxito!' : 'Error',
        result.success ? 'Invitación eliminada correctamente' : result.error || 'No se pudo eliminar la invitación',
      )
    } catch (error) {
      console.error('Error revoking invitation:', error)
      showModal('error', 'Error de conexión', 'Hubo un problema al intentar eliminar la invitación')
    } finally {
      setRevokingId(null)
    }
  }

  return {
    activeSubTab,
    confirmRevokeInvitation,
    filteredInvitations,
    filteredLinks,
    filteredMembers,
    invitationToRevoke,
    isInviteModalOpen,
    manageMember,
    manageMode,
    modalConfig,
    resendingId,
    revokingId,
    roleFilter,
    searchTerm,
    setActiveSubTab,
    setInvitationToRevoke,
    setIsInviteModalOpen,
    setManageMember,
    setManageMode,
    setModalConfig,
    setRoleFilter,
    setSearchTerm,
    handleResendInvitation,
  }
}
