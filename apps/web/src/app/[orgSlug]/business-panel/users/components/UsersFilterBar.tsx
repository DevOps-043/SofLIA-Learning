'use client'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { buildTabs } from './users-filter-bar/users-filter-options'
import type { UsersFilterBarProps } from './users-filter-bar/users-filter-bar.types'
import { UsersAdvancedFilters } from './users-filter-bar/UsersAdvancedFilters'
import { UsersPrimaryFilters } from './users-filter-bar/UsersPrimaryFilters'
import { UsersTabStrip } from './users-filter-bar/UsersTabStrip'

export function UsersFilterBar(props: UsersFilterBarProps) {
  const theme = useBusinessPanelTheme()
  const closeDropdowns = () => {
    props.setIsRoleDropdownOpen(false)
    props.setIsStatusDropdownOpen(false)
    props.setIsRegionDropdownOpen(false)
    props.setIsZoneDropdownOpen(false)
    props.setIsTeamDropdownOpen(false)
  }

  return (
    <>
      <UsersTabStrip activeTab={props.activeTab} setActiveTab={props.setActiveTab} tabs={buildTabs(props)} theme={theme} />
      <UsersPrimaryFilters closeDropdowns={closeDropdowns} props={props} theme={theme} />
      <UsersAdvancedFilters closeDropdowns={closeDropdowns} props={props} theme={theme} />
    </>
  )
}
