'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { BusinessUser, CreateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ToastType } from '@/core/components/ToastNotification/ToastNotification'

export function useBusinessUsersPageLogic() {
  type BusinessUsersTab = 'users' | 'invitations' | 'links'
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as BusinessUsersTab | null
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const {
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    syncOrgData: refetch,
    createUser,
    updateUser,
    deleteUser: originalDeleteUser,
    resendInvitation: originalResendInvitation,
    suspendUser: originalSuspendUser,
    activateUser: originalActivateUser,
    updateInviteLinkStatus: originalUpdateInviteLinkStatus,
    deleteInviteLink: originalDeleteInviteLink
  } = useBusinessUsers(orgSlug)
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
  const handleSaveNewUser = async (userData: CreateBusinessUserRequest) => {
    try {
      const result = await createUser(userData)
      if (result.success) {
        showToast('Usuario creado con éxito', 'success')
        setIsAddModalOpen(false)
        refetch()
      } else {
        showToast(result.error || 'Error al crear usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al crear usuario', 'error')
    }
  }

  const resendInvitation = async (id: string) => {
    try {
      const result = await originalResendInvitation(id)
      if (result.success) {
        showToast('Invitación reenviada con éxito', 'success')
      } else {
        showToast(result.error || 'Error al reenviar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al reenviar invitación', 'error')
    }
  }

  const suspendUser = async (id: string) => {
    try {
      const result = await originalSuspendUser(id)
      if (result.success) {
        showToast('Usuario suspendido', 'success')
      } else {
        showToast(result.error || 'Error al suspender usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al suspender usuario', 'error')
    }
  }

  const activateUser = async (id: string) => {
    try {
      const result = await originalActivateUser(id)
      if (result.success) {
        showToast('Usuario activado', 'success')
      } else {
        showToast(result.error || 'Error al activar usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al activar usuario', 'error')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const result = await originalDeleteUser(id)
      if (result.success) {
        showToast('Usuario eliminado con éxito', 'success')
        setIsDeleteModalOpen(false)
        setDeletingUser(null)
      } else {
        showToast(result.error || 'Error al eliminar usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al eliminar usuario', 'error')
    }
  }

  const updateInviteLinkStatus = async (id: string, action: 'pause' | 'resume') => {
    try {
      const result = await originalUpdateInviteLinkStatus(id, action)
      if (result.success) {
        showToast(action === 'pause' ? 'Enlace pausado' : 'Enlace reactivado', 'success')
      } else {
        showToast(result.error || 'Error al actualizar enlace', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al actualizar enlace', 'error')
    }
  }

  const deleteInviteLink = async (id: string) => {
    try {
      const result = await originalDeleteInviteLink(id)
      if (result.success) {
        showToast('Enlace eliminado', 'success')
      } else {
        showToast(result.error || 'Error al eliminar enlace', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al eliminar enlace', 'error')
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

  // View mode and Tabs state
  const [activeTab, setActiveTab] = useState<BusinessUsersTab>(initialTab || 'users')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Effect to sync tab from URL
  useEffect(() => {
    if (initialTab && ['users', 'invitations', 'links'].includes(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Effect to handle custom tab changes
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<BusinessUsersTab>
      if (customEvent.detail && ['users', 'invitations', 'links'].includes(customEvent.detail)) {
        setActiveTab(customEvent.detail)
        // Scroll to top if needed or just switch
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('change-user-tab', handleTabChange)
    return () => window.removeEventListener('change-user-tab', handleTabChange)
  }, [])

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

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
  const uniqueRegions = [...new Set(users.filter(u => u.region_name).map(u => u.region_name))]
  const uniqueZones = [...new Set(users.filter(u => u.zone_name).map(u => u.zone_name))]
  const uniqueTeams = [...new Set(users.filter(u => u.team_name).map(u => u.team_name))]

  // Count active filters
  const activeFiltersCount = [filterRole, filterStatus, filterRegion, filterZone, filterTeam].filter(f => f !== 'all').length

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.org_role === filterRole
    const matchesStatus = filterStatus === 'all' || user.org_status === filterStatus
    const matchesRegion = filterRegion === 'all' || user.region_name === filterRegion
    const matchesZone = filterZone === 'all' || user.zone_name === filterZone
    const matchesTeam = filterTeam === 'all' || user.team_name === filterTeam
    return matchesSearch && matchesRole && matchesStatus && matchesRegion && matchesZone && matchesTeam
  })

  const filteredInvitations = invitations.filter(inv =>
    inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Clear all filters helper
  const clearAllFilters = () => {
    setFilterRole('all')
    setFilterStatus('all')
    setFilterRegion('all')
    setFilterZone('all')
    setFilterTeam('all')
    setSearchTerm('')
  }

  // Theme Logic
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const themeColors = useMemo(() => ({
    text: isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A',
    secondaryText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    cardBg: isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF',
    borderColor: isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)',
    primary: panelStyles?.primary_button_color || '#0A2540',
    secondary: panelStyles?.secondary_button_color || '#1E2329',
    accent: panelStyles?.accent_color || '#00D4B3'
  }), [panelStyles, isDark])

  const { primary: primaryColor, secondary: secondaryColor, accent: accentColor } = themeColors

  return {
    // Data
    orgSlug,
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    refetch,
    currentUser,
    updateUser,

    // Filtered data
    filteredUsers,
    filteredInvitations,

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

    // Theme
    isDark,
    primaryColor,
    secondaryColor,
    accentColor,
    themeColors,
  }
}
