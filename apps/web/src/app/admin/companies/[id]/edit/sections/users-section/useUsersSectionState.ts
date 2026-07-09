'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useMemo, useState } from 'react'
import type { CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import {
  BusinessUsersService,
  type BusinessUser,
  type UpdateBusinessUserRequest,
} from '@/features/business-panel/services/businessUsers.service'
import type { UsersModalConfig, UsersSectionProps, CompanyUsersSubTab } from './types'
import { resendCompanyInvitation, revokeCompanyInvitation } from './users-section.actions'
import { filterInviteLinks, filterInvitations, filterMembers } from './users-section.helpers'

export function useUsersSectionState({ company, onUpdate }: UsersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeSubTab, setActiveSubTab] = useState<CompanyUsersSubTab>('members')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [manageMember, setManageMember] = useState<CompanyMember | null>(null)
  const [manageMode, setManageMode] = useState<'assignments' | 'delete' | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)
  const [modalConfig, setModalConfig] = useState<UsersModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })

  const [businessUsersById, setBusinessUsersById] = useState<Map<string, BusinessUser>>(new Map())
  const [statsMember, setStatsMember] = useState<CompanyMember | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [profileMember, setProfileMember] = useState<CompanyMember | null>(null)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)

  const orgSlug = company.slug || null

  useEffect(() => {
    if (!orgSlug) {
      setBusinessUsersById(new Map())
      return
    }

    let cancelled = false

    BusinessUsersService.getOrganizationUsers(orgSlug).then(({ users }) => {
      if (cancelled) return
      setBusinessUsersById(new Map(users.map((businessUser) => [businessUser.id, businessUser])))
    })

    return () => {
      cancelled = true
    }
  }, [orgSlug])

  const filteredMembers = useMemo(() => filterMembers(company, searchTerm, roleFilter), [company, roleFilter, searchTerm])
  const filteredInvitations = useMemo(() => filterInvitations(company, searchTerm), [company, searchTerm])
  const filteredLinks = useMemo(() => filterInviteLinks(company, searchTerm), [company, searchTerm])
  const showModal = (type: 'success' | 'error', title: string, message?: string) => setModalConfig({ isOpen: true, type, title, message })

  const openStats = (member: CompanyMember) => {
    if (!businessUsersById.has(member.user_id)) {
      showModal('error', 'Error', 'No se pudo cargar la informacion completa de este usuario')
      return
    }
    setStatsMember(member)
    setIsStatsModalOpen(true)
  }

  const closeStats = () => {
    setIsStatsModalOpen(false)
    setStatsMember(null)
  }

  const openEditProfile = (member: CompanyMember) => {
    if (!businessUsersById.has(member.user_id)) {
      showModal('error', 'Error', 'No se pudo cargar la informacion completa de este usuario')
      return
    }
    setProfileMember(member)
    setIsEditProfileModalOpen(true)
  }

  const closeEditProfile = () => {
    setIsEditProfileModalOpen(false)
    setProfileMember(null)
  }

  const handleSaveProfile = async (userId: string, data: UpdateBusinessUserRequest) => {
    if (!orgSlug) return
    const updatedUser = await BusinessUsersService.updateUser(orgSlug, userId, data)
    setBusinessUsersById((previous) => new Map(previous).set(updatedUser.id, updatedUser))
    onUpdate()
  }

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
      techDebtLogger.error('Error resending invitation:', error)
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
      techDebtLogger.error('Error revoking invitation:', error)
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
    orgSlug,
    businessUsersById,
    statsMember,
    isStatsModalOpen,
    openStats,
    closeStats,
    profileMember,
    isEditProfileModalOpen,
    openEditProfile,
    closeEditProfile,
    handleSaveProfile,
  }
}
