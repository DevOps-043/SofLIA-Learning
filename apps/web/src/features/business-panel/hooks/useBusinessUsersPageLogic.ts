'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { useJoinRequests } from '@/features/business-panel/hooks/useJoinRequests'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessUser, CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

export function useBusinessUsersPageLogic() {
  type BusinessUsersTab = 'users' | 'invitations' | 'links' | 'requests'
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as BusinessUsersTab | null
  const [activeTab, setActiveTab] = useState<BusinessUsersTab>(initialTab || 'users')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250)
  const activeResource = activeTab === 'invitations' || activeTab === 'links' ? activeTab : 'users'
  const {
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    paginationByResource,
    activePagination,
    resourceTotals,
    syncOrgData: refetch,
    setResourcePage,
    createUser,
    updateUser,
    deleteUser: originalDeleteUser,
    resendInvitation: originalResendInvitation,
    suspendUser: originalSuspendUser,
    activateUser: originalActivateUser,
    updateInviteLinkStatus: originalUpdateInviteLinkStatus,
    deleteInviteLink: originalDeleteInviteLink
  } = useBusinessUsers(orgSlug, {
    activeResource,
    searchTerm: debouncedSearchTerm,
    filterRole,
    filterStatus,
  })
  const {
    requests: joinRequests,
    count: joinRequestsCount,
    isLoading: isJoinRequestsLoading,
    error: joinRequestsError,
    reviewRequest: originalReviewJoinRequest,
    reviewingId,
  } = useJoinRequests()
  const { user: currentUser } = useAuth()

  // Toast state
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success'
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Wrapped actions with notifications
  // These underlying functions throw on failure and return void on success,
  // so we use try/catch instead of checking result.success.
  const handleSaveNewUser = async (userData: CreateBusinessUserRequest) => {
    try {
      await createUser(userData)
      showToast('Usuario creado con éxito', 'success')
      setIsAddModalOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear usuario', 'error')
    }
  }

  const resendInvitation = async (id: string) => {
    try {
      await originalResendInvitation(id)
      showToast('Invitación reenviada con éxito', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al reenviar invitación', 'error')
    }
  }

  const suspendUser = async (id: string) => {
    try {
      await originalSuspendUser(id)
      showToast('Usuario suspendido', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al suspender usuario', 'error')
    }
  }

  const activateUser = async (id: string) => {
    try {
      await originalActivateUser(id)
      showToast('Usuario activado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al activar usuario', 'error')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await originalDeleteUser(id)
      showToast('Usuario eliminado con éxito', 'success')
      setIsDeleteModalOpen(false)
      setDeletingUser(null)
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
      await originalDeleteInviteLink(id)
      showToast('Enlace eliminado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar enlace', 'error')
    }
  }

  const handleResendIndividualInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}/resend`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        showToast('Invitación reenviada con éxito', 'success')
        refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al reenviar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al reenviar invitación', 'error')
    }
  }

  const handleRevokeInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        showToast('Invitación revocada con éxito', 'success')
        refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al revocar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al revocar invitación', 'error')
    }
  }

  const reviewJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await originalReviewJoinRequest(requestId, action)
      if (action === 'approve') {
        showToast('Solicitud aprobada con éxito', 'success')
        refetch()
      } else {
        showToast('Solicitud rechazada', 'success')
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al procesar la solicitud',
        'error'
      )
    }
  }

  // Effect to sync tab from URL
  useEffect(() => {
    if (initialTab && ['users', 'invitations', 'links', 'requests'].includes(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Effect to handle custom tab changes
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<BusinessUsersTab>
      if (customEvent.detail && ['users', 'invitations', 'links', 'requests'].includes(customEvent.detail)) {
        setActiveTab(customEvent.detail)
        // Scroll to top if needed or just switch
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('change-user-tab', handleTabChange)
    return () => window.removeEventListener('change-user-tab', handleTabChange)
  }, [])

  // Dropdown states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false)
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)

  // Modal states
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<BusinessUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [statsUser, setStatsUser] = useState<BusinessUser | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isUnifiedInviteModalOpen, setIsUnifiedInviteModalOpen] = useState(false)

  // Extract unique values for hierarchy filters
  const uniqueRegions = useMemo(
    () => [...new Set(users.map((user) => user.region_name ?? null))],
    [users],
  )
  const uniqueZones = useMemo(
    () => [...new Set(users.map((user) => user.zone_name ?? null))],
    [users],
  )
  const uniqueTeams = useMemo(
    () => [...new Set(users.map((user) => user.team_name ?? null))],
    [users],
  )

  // Count active filters
  const activeFiltersCount = useMemo(
    () => [filterRole, filterStatus, filterRegion, filterZone, filterTeam].filter(f => f !== 'all').length,
    [filterRegion, filterRole, filterStatus, filterTeam, filterZone],
  )

  const normalizedSearchTerm = useMemo(
    () => debouncedSearchTerm.trim().toLowerCase(),
    [debouncedSearchTerm],
  )

  const filteredUsers = useMemo(
    () => users.filter(user => {
      const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
      const matchesSearch = normalizedSearchTerm.length === 0 ||
        displayName.toLowerCase().includes(normalizedSearchTerm) ||
        user.email.toLowerCase().includes(normalizedSearchTerm) ||
        user.username.toLowerCase().includes(normalizedSearchTerm)
      const matchesRole = filterRole === 'all' || user.org_role === filterRole
      const matchesStatus = filterStatus === 'all' || user.org_status === filterStatus
      const matchesRegion = filterRegion === 'all' || user.region_name === filterRegion
      const matchesZone = filterZone === 'all' || user.zone_name === filterZone
      const matchesTeam = filterTeam === 'all' || user.team_name === filterTeam
      return matchesSearch && matchesRole && matchesStatus && matchesRegion && matchesZone && matchesTeam
    }),
    [filterRegion, filterRole, filterStatus, filterTeam, filterZone, normalizedSearchTerm, users],
  )

  const filteredInvitations = useMemo(
    () => invitations.filter(inv =>
      normalizedSearchTerm.length === 0 ||
      inv.email.toLowerCase().includes(normalizedSearchTerm) ||
      inv.role.toLowerCase().includes(normalizedSearchTerm)
    ),
    [invitations, normalizedSearchTerm],
  )

  const filteredInviteLinks = useMemo(
    () => inviteLinks.filter((link) =>
      normalizedSearchTerm.length === 0 ||
      (link.name || '').toLowerCase().includes(normalizedSearchTerm) ||
      link.role.toLowerCase().includes(normalizedSearchTerm) ||
      link.status.toLowerCase().includes(normalizedSearchTerm) ||
      link.token.toLowerCase().includes(normalizedSearchTerm)
    ),
    [inviteLinks, normalizedSearchTerm],
  )

  const filteredJoinRequests = useMemo(
    () => joinRequests.filter((request) => {
      if (normalizedSearchTerm.length === 0) {
        return true
      }

      const displayName = request.users
        ? [request.users.first_name, request.users.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || request.users.username
        : 'usuario'

      return (
        displayName.toLowerCase().includes(normalizedSearchTerm) ||
        request.users?.email.toLowerCase().includes(normalizedSearchTerm) ||
        request.job_title?.toLowerCase().includes(normalizedSearchTerm) ||
        request.message?.toLowerCase().includes(normalizedSearchTerm)
      )
    }),
    [joinRequests, normalizedSearchTerm],
  )

  // Clear all filters helper
  const clearAllFilters = useCallback(() => {
    setFilterRole('all')
    setFilterStatus('all')
    setFilterRegion('all')
    setFilterZone('all')
    setFilterTeam('all')
    setSearchTerm('')
  }, [])

  // Theme tokens — centralized via useBusinessPanelTheme
  const theme = useBusinessPanelTheme()
  const { isDark, primaryColor, accentColor, secondaryColor } = theme
  // Legacy alias kept for consumers that destructure themeColors
  const themeColors = {
    text: theme.textColor,
    secondaryText: theme.subtextColor,
    cardBg: theme.cardBg,
    borderColor: theme.borderColor,
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
  }

  return {
    // Data
    orgSlug,
    users,
    invitations,
    inviteLinks,
    joinRequests,
    joinRequestsCount,
    stats,
    orgData,
    isLoading,
    error,
    isJoinRequestsLoading,
    joinRequestsError,
    refetch,
    paginationByResource,
    activePagination,
    resourceTotals,
    setResourcePage,
    currentUser,
    updateUser,

    // Filtered data
    filteredUsers,
    filteredInvitations,
    filteredInviteLinks,
    filteredJoinRequests,

    // Hierarchy filter options
    uniqueRegions,
    uniqueZones,
    uniqueTeams,

    // Tab & view
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,

    // Search & filters
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    filterRegion,
    setFilterRegion,
    filterZone,
    setFilterZone,
    filterTeam,
    setFilterTeam,
    showAdvancedFilters,
    setShowAdvancedFilters,
    activeFiltersCount,
    clearAllFilters,

    // Dropdown open states
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    isRegionDropdownOpen,
    setIsRegionDropdownOpen,
    isZoneDropdownOpen,
    setIsZoneDropdownOpen,
    isTeamDropdownOpen,
    setIsTeamDropdownOpen,

    // Modal states
    editingUser,
    setEditingUser,
    deletingUser,
    setDeletingUser,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    statsUser,
    setStatsUser,
    isStatsModalOpen,
    setIsStatsModalOpen,
    isUnifiedInviteModalOpen,
    setIsUnifiedInviteModalOpen,

    // Toast
    toast,
    setToast,

    // Actions
    handleSaveNewUser,
    resendInvitation,
    suspendUser,
    activateUser,
    deleteUser,
    updateInviteLinkStatus,
    deleteInviteLink,
    handleResendIndividualInvitation,
    handleRevokeInvitation,
    reviewJoinRequest,
    reviewingId,

    // Theme
    isDark,
    primaryColor,
    secondaryColor,
    accentColor,
    themeColors,
  }
}
