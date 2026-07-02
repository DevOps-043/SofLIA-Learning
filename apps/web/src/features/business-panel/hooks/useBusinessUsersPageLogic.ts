'use client'

import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { useJoinRequests } from '@/features/business-panel/hooks/useJoinRequests'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useBusinessUsersFilteredData } from './useBusinessUsersPageLogic/useBusinessUsersFilteredData'
import { useBusinessUsersFilters } from './useBusinessUsersPageLogic/useBusinessUsersFilters'
import { useBusinessUsersModals } from './useBusinessUsersPageLogic/useBusinessUsersModals'
import { useBusinessUsersPrimaryActions } from './useBusinessUsersPageLogic/useBusinessUsersPrimaryActions'
import { useBusinessUsersSecondaryActions } from './useBusinessUsersPageLogic/useBusinessUsersSecondaryActions'
import { useBusinessUsersTabs } from './useBusinessUsersPageLogic/useBusinessUsersTabs'
import { useBusinessUsersTheme } from './useBusinessUsersPageLogic/useBusinessUsersTheme'
import { useBusinessUsersToast } from './useBusinessUsersPageLogic/useBusinessUsersToast'

export function useBusinessUsersPageLogic() {
  const tabs = useBusinessUsersTabs()
  const filters = useBusinessUsersFilters()
  const modals = useBusinessUsersModals()
  const toastState = useBusinessUsersToast()
  const usersState = useBusinessUsers(tabs.orgSlug, {
    activeResource: tabs.activeResource,
    searchTerm: filters.debouncedSearchTerm,
    filterRole: filters.filterRole,
    filterStatus: filters.filterStatus,
  })
  const joinState = useJoinRequests()
  const { user: currentUser } = useAuth()
  const filteredData = useBusinessUsersFilteredData({
    users: usersState.users,
    invitations: usersState.invitations,
    inviteLinks: usersState.inviteLinks,
    joinRequests: joinState.requests,
    normalizedSearchTerm: filters.normalizedSearchTerm,
    filterRole: filters.filterRole,
    filterStatus: filters.filterStatus,
    filterRegion: filters.filterRegion,
    filterZone: filters.filterZone,
    filterTeam: filters.filterTeam,
  })
  const primaryActions = useBusinessUsersPrimaryActions({
    createUser: usersState.createUser,
    resendInvitation: usersState.resendInvitation,
    suspendUser: usersState.suspendUser,
    activateUser: usersState.activateUser,
    deleteUser: usersState.deleteUser,
    updateInviteLinkStatus: usersState.updateInviteLinkStatus,
    deleteInviteLink: usersState.deleteInviteLink,
    showToast: toastState.showToast,
    setIsAddModalOpen: modals.setIsAddModalOpen,
    setIsDeleteModalOpen: modals.setIsDeleteModalOpen,
    setDeletingUser: modals.setDeletingUser,
  })
  const secondaryActions = useBusinessUsersSecondaryActions({
    orgSlug: tabs.orgSlug,
    refetch: usersState.syncOrgData,
    reviewJoinRequest: joinState.reviewRequest,
    showToast: toastState.showToast,
  })
  const theme = useBusinessUsersTheme()

  return {
    users: usersState.users,
    invitations: usersState.invitations,
    inviteLinks: usersState.inviteLinks,
    joinRequests: joinState.requests,
    joinRequestsCount: joinState.count,
    stats: usersState.stats,
    orgData: usersState.orgData,
    isLoading: usersState.isLoading,
    error: usersState.error,
    isJoinRequestsLoading: joinState.isLoading,
    joinRequestsError: joinState.error,
    refetch: usersState.syncOrgData,
    paginationByResource: usersState.paginationByResource,
    activePagination: usersState.activePagination,
    resourceTotals: usersState.resourceTotals,
    setResourcePage: usersState.setResourcePage,
    currentUser,
    updateUser: usersState.updateUser,
    ...filteredData,
    ...tabs,
    ...filters,
    ...modals,
    toast: toastState.toast,
    setToast: toastState.setToast,
    showToast: toastState.showToast,
    ...primaryActions,
    ...secondaryActions,
    reviewingId: joinState.reviewingId,
    ...theme,
  }
}
