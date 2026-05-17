'use client'

import { Filter } from 'lucide-react'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { FilterDropdown } from './FilterDropdown'
import { getRoleOptions, getSearchPlaceholder, getStatusOptions } from './users-filter-options'
import type { UsersFilterBarProps, UsersFilterBarTheme } from './users-filter-bar.types'
import { ViewModeToggle } from './ViewModeToggle'

type UsersPrimaryFiltersProps = { closeDropdowns: () => void; props: UsersFilterBarProps; theme: UsersFilterBarTheme }

export function UsersPrimaryFilters({ closeDropdowns, props, theme }: UsersPrimaryFiltersProps) {
  const isUsersTab = props.activeTab === 'users'
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <BusinessPanelSearchInput value={props.searchTerm} onChange={props.setSearchTerm} placeholder={getSearchPlaceholder(props.activeTab, props.t)} className="flex-1" />
      {isUsersTab ? <>
        <FilterDropdown activeColor={theme.primaryColor} isOpen={props.isRoleDropdownOpen} label={getRoleOptions(props.t).find((option) => option.value === props.filterRole)?.label || props.filterRole} onToggle={() => { closeDropdowns(); props.setIsRoleDropdownOpen(!props.isRoleDropdownOpen) }} options={getRoleOptions(props.t)} setOpen={props.setIsRoleDropdownOpen} setValue={props.setFilterRole} theme={theme} value={props.filterRole} />
        <FilterDropdown activeColor={theme.accentColor} isOpen={props.isStatusDropdownOpen} label={getStatusOptions(props.t).find((option) => option.value === props.filterStatus)?.label || props.filterStatus} onToggle={() => { closeDropdowns(); props.setIsStatusDropdownOpen(!props.isStatusDropdownOpen) }} options={getStatusOptions(props.t)} setOpen={props.setIsStatusDropdownOpen} setValue={props.setFilterStatus} theme={theme} value={props.filterStatus} />
        <button onClick={() => props.setShowAdvancedFilters(!props.showAdvancedFilters)} className="flex items-center gap-2 rounded-xl border-2 px-4 py-3.5 transition-all duration-300" style={{ backgroundColor: props.showAdvancedFilters ? `${theme.primaryColor}20` : theme.cardBg, borderColor: props.showAdvancedFilters || props.activeFiltersCount > 0 ? theme.primaryColor : theme.borderColor, color: theme.textColor }}><Filter className="h-4 w-4" /><span className="hidden text-sm sm:inline">{props.t('users.filters.advanced')}</span>{props.activeFiltersCount > 0 ? <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>{props.activeFiltersCount}</span> : null}</button>
      </> : null}
      <ViewModeToggle setViewMode={props.setViewMode} t={props.t} theme={theme} viewMode={props.viewMode} />
    </div>
  )
}
