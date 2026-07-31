'use client'

import { Filter, Search, X } from 'lucide-react'

import { FilterDropdown } from './FilterDropdown'
import { getRoleOptions, getSearchPlaceholder, getStatusOptions } from './users-filter-options'
import type { UsersFilterBarProps, UsersFilterBarTheme } from './users-filter-bar.types'
import { ViewModeToggle } from './ViewModeToggle'
import styles from '../UsersPanel.module.css'

type UsersPrimaryFiltersProps = { closeDropdowns: () => void; props: UsersFilterBarProps; theme: UsersFilterBarTheme }

export function UsersPrimaryFilters({ closeDropdowns, props, theme }: UsersPrimaryFiltersProps) {
  const isUsersTab = props.activeTab === 'users'
  return (
    <div className={styles.primaryFilters}>
      <div className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          value={props.searchTerm}
          onChange={(event) => props.setSearchTerm(event.target.value)}
          placeholder={getSearchPlaceholder(props.activeTab, props.t)}
          className={styles.searchInput}
          aria-label={getSearchPlaceholder(props.activeTab, props.t)}
        />
        {props.searchTerm ? (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => props.setSearchTerm('')}
            aria-label={props.t('users.filters.clearSearch', 'Limpiar búsqueda')}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {isUsersTab ? <>
        <FilterDropdown activeColor={theme.primaryColor} isOpen={props.isRoleDropdownOpen} label={getRoleOptions(props.t).find((option) => option.value === props.filterRole)?.label || props.filterRole} onToggle={() => { closeDropdowns(); props.setIsRoleDropdownOpen(!props.isRoleDropdownOpen) }} options={getRoleOptions(props.t)} setOpen={props.setIsRoleDropdownOpen} setValue={props.setFilterRole} theme={theme} value={props.filterRole} />
        <FilterDropdown activeColor={theme.accentColor} isOpen={props.isStatusDropdownOpen} label={getStatusOptions(props.t).find((option) => option.value === props.filterStatus)?.label || props.filterStatus} onToggle={() => { closeDropdowns(); props.setIsStatusDropdownOpen(!props.isStatusDropdownOpen) }} options={getStatusOptions(props.t)} setOpen={props.setIsStatusDropdownOpen} setValue={props.setFilterStatus} theme={theme} value={props.filterStatus} />
        <button
          type="button"
          onClick={() => props.setShowAdvancedFilters(!props.showAdvancedFilters)}
          className={`${styles.advancedToggle} ${props.showAdvancedFilters ? styles.advancedToggleActive : ''}`}
          aria-expanded={props.showAdvancedFilters}
        >
          <Filter aria-hidden="true" />
          <span>{props.t('users.filters.advanced')}</span>
          {props.activeFiltersCount > 0 ? <span className={styles.advancedCount}>{props.activeFiltersCount}</span> : null}
        </button>
      </> : null}
      <ViewModeToggle setViewMode={props.setViewMode} t={props.t} theme={theme} viewMode={props.viewMode} />
    </div>
  )
}
