'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, MapPin, Network, X } from 'lucide-react'
import { FilterDropdown } from './FilterDropdown'
import { getCollectionOptions, getResultsCount } from './users-filter-options'
import type { UsersFilterBarProps, UsersFilterBarTheme } from './users-filter-bar.types'
import styles from '../UsersPanel.module.css'

type UsersAdvancedFiltersProps = { closeDropdowns: () => void; props: UsersFilterBarProps; theme: UsersFilterBarTheme }

export function UsersAdvancedFilters({ closeDropdowns, props, theme }: UsersAdvancedFiltersProps) {
  if (props.activeTab !== 'users') return null
  return (
    <AnimatePresence>
      {props.showAdvancedFilters ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={styles.advancedFilters}>
        {props.uniqueRegions.length > 0 ? <FilterDropdown activeColor={theme.accentColor} icon={<MapPin className="h-4 w-4 flex-shrink-0 opacity-60" />} isOpen={props.isRegionDropdownOpen} label={props.filterRegion === 'all' ? props.t('users.filters.allRegions') : props.filterRegion} onToggle={() => { closeDropdowns(); props.setIsRegionDropdownOpen(!props.isRegionDropdownOpen) }} options={getCollectionOptions(props.uniqueRegions, props.t('users.filters.allRegions'))} setOpen={props.setIsRegionDropdownOpen} setValue={props.setFilterRegion} theme={theme} value={props.filterRegion} variant="advanced" /> : null}
        {props.uniqueZones.length > 0 ? <FilterDropdown activeColor={theme.accentColor} icon={<Building2 className="h-4 w-4 flex-shrink-0 opacity-60" />} isOpen={props.isZoneDropdownOpen} label={props.filterZone === 'all' ? props.t('users.filters.allZones') : props.filterZone} onToggle={() => { closeDropdowns(); props.setIsZoneDropdownOpen(!props.isZoneDropdownOpen) }} options={getCollectionOptions(props.uniqueZones, props.t('users.filters.allZones'))} setOpen={props.setIsZoneDropdownOpen} setValue={props.setFilterZone} theme={theme} value={props.filterZone} variant="advanced" /> : null}
        {props.uniqueTeams.length > 0 ? <FilterDropdown activeColor={theme.accentColor} icon={<Network className="h-4 w-4 flex-shrink-0 opacity-60" />} isOpen={props.isTeamDropdownOpen} label={props.filterTeam === 'all' ? props.t('users.filters.allTeams') : props.filterTeam} onToggle={() => { closeDropdowns(); props.setIsTeamDropdownOpen(!props.isTeamDropdownOpen) }} options={getCollectionOptions(props.uniqueTeams, props.t('users.filters.allTeams'))} setOpen={props.setIsTeamDropdownOpen} setValue={props.setFilterTeam} theme={theme} value={props.filterTeam} variant="advanced" /> : null}
        {props.activeFiltersCount > 0 ? <button type="button" onClick={props.clearAllFilters} className={styles.clearFilters}><X aria-hidden="true" />{props.t('users.filters.clear')}</button> : null}
        <div className={styles.resultsCount} aria-live="polite">{getResultsCount(props)} {props.t('users.filters.results')}</div>
      </motion.div> : null}
    </AnimatePresence>
  )
}
