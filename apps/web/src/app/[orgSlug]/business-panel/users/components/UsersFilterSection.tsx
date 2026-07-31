'use client'

import { useTranslation } from 'react-i18next'

import { UsersFilterBar } from './UsersFilterBar'
import styles from './UsersPanel.module.css'
import type { BusinessUsersPageLogic } from './users-page.types'

interface UsersFilterSectionProps {
  logic: BusinessUsersPageLogic
}

export function UsersFilterSection({ logic }: UsersFilterSectionProps) {
  const { t } = useTranslation('business')

  return (
    <section id="tour-users-filters" className={styles.controlsSurface} aria-label={t('users.filters.title', 'Filtros de usuarios')}>
      <UsersFilterBar
        activeTab={logic.activeTab}
        setActiveTab={logic.setActiveTab}
        totalCounts={{
          users: logic.resourceTotals.users,
          invitations: logic.resourceTotals.invitations,
          inviteLinks: logic.resourceTotals.inviteLinks,
          joinRequests: logic.joinRequestsCount,
        }}
        searchTerm={logic.searchTerm}
        setSearchTerm={logic.setSearchTerm}
        filterRole={logic.filterRole}
        setFilterRole={logic.setFilterRole}
        isRoleDropdownOpen={logic.isRoleDropdownOpen}
        setIsRoleDropdownOpen={logic.setIsRoleDropdownOpen}
        filterStatus={logic.filterStatus}
        setFilterStatus={logic.setFilterStatus}
        isStatusDropdownOpen={logic.isStatusDropdownOpen}
        setIsStatusDropdownOpen={logic.setIsStatusDropdownOpen}
        showAdvancedFilters={logic.showAdvancedFilters}
        setShowAdvancedFilters={logic.setShowAdvancedFilters}
        activeFiltersCount={logic.activeFiltersCount}
        clearAllFilters={logic.clearAllFilters}
        viewMode={logic.viewMode}
        setViewMode={logic.setViewMode}
        uniqueRegions={logic.uniqueRegions}
        filterRegion={logic.filterRegion}
        setFilterRegion={logic.setFilterRegion}
        isRegionDropdownOpen={logic.isRegionDropdownOpen}
        setIsRegionDropdownOpen={logic.setIsRegionDropdownOpen}
        uniqueZones={logic.uniqueZones}
        filterZone={logic.filterZone}
        setFilterZone={logic.setFilterZone}
        isZoneDropdownOpen={logic.isZoneDropdownOpen}
        setIsZoneDropdownOpen={logic.setIsZoneDropdownOpen}
        uniqueTeams={logic.uniqueTeams}
        filterTeam={logic.filterTeam}
        setFilterTeam={logic.setFilterTeam}
        isTeamDropdownOpen={logic.isTeamDropdownOpen}
        setIsTeamDropdownOpen={logic.setIsTeamDropdownOpen}
        filteredUsers={logic.filteredUsers}
        filteredInvitations={logic.filteredInvitations}
        filteredInviteLinks={logic.filteredInviteLinks}
        filteredJoinRequests={logic.filteredJoinRequests}
        t={t}
      />
    </section>
  )
}
