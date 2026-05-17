import type { Dispatch, SetStateAction } from 'react'
import type { TFunction } from 'i18next'
import type { BusinessInvitation, BulkInviteLink, BusinessUser } from '@/features/business-panel/services/businessUsers.service'
import type { JoinRequest } from '@/features/business-panel/services/joinRequests.service'
import type { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

export type UserManagementTab = 'users' | 'invitations' | 'links' | 'requests'
export type UserManagementViewMode = 'cards' | 'list'
export type UsersFilterBarTheme = ReturnType<typeof useBusinessPanelTheme>
export type DropdownKey = 'role' | 'status' | 'region' | 'zone' | 'team'
export type FilterOption = { value: string; label: string }

export interface UsersFilterBarProps {
  activeTab: UserManagementTab
  setActiveTab: Dispatch<SetStateAction<UserManagementTab>>
  totalCounts: { users: number; invitations: number; inviteLinks: number; joinRequests: number }
  searchTerm: string
  setSearchTerm: (v: string) => void
  filterRole: string
  setFilterRole: (v: string) => void
  isRoleDropdownOpen: boolean
  setIsRoleDropdownOpen: (v: boolean) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  isStatusDropdownOpen: boolean
  setIsStatusDropdownOpen: (v: boolean) => void
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (v: boolean) => void
  activeFiltersCount: number
  clearAllFilters: () => void
  viewMode: UserManagementViewMode
  setViewMode: Dispatch<SetStateAction<UserManagementViewMode>>
  uniqueRegions: (string | null | undefined)[]
  filterRegion: string
  setFilterRegion: (v: string) => void
  isRegionDropdownOpen: boolean
  setIsRegionDropdownOpen: (v: boolean) => void
  uniqueZones: (string | null | undefined)[]
  filterZone: string
  setFilterZone: (v: string) => void
  isZoneDropdownOpen: boolean
  setIsZoneDropdownOpen: (v: boolean) => void
  uniqueTeams: (string | null | undefined)[]
  filterTeam: string
  setFilterTeam: (v: string) => void
  isTeamDropdownOpen: boolean
  setIsTeamDropdownOpen: (v: boolean) => void
  filteredUsers: BusinessUser[]
  filteredInvitations: BusinessInvitation[]
  filteredInviteLinks: BulkInviteLink[]
  filteredJoinRequests: JoinRequest[]
  t: TFunction
}
