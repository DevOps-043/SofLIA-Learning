'use client'

import { ChevronDown, ChevronUp, RefreshCcw, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { PremiumDatePicker } from '../PremiumDatePicker'
import { buildSelectFilterDefinitions, type SelectFilterDefinition } from './filter-definitions'
import { GranularityControl } from './GranularityControl'
import { PremiumSelectFilter } from './PremiumSelectFilter'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsFilterUpdater, ReportsAnalyticsFilters, ReportsAnalyticsT } from './types'

function DateFilter({ label, value, placeholder, onChange }: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className={styles.filterField}>
      <span className={styles.filterLabel}>{label}</span>
      <PremiumDatePicker value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

function ActiveChips({ selectFilters, t, onFilterChange }: {
  selectFilters: SelectFilterDefinition[]
  t: ReportsAnalyticsT
  onFilterChange: ReportsAnalyticsFilterUpdater
}) {
  const activeFilters: Array<{ key: string; label: string; onRemove: () => void }> = []

  const filterKeyMap: Record<string, keyof ReportsAnalyticsFilters> = {
    [t('reportsAnalytics.filters.course')]: 'courseId',
    [t('reportsAnalytics.filters.jobTitle')]: 'jobTitle',
    [t('reportsAnalytics.filters.status')]: 'status',
    [t('reportsAnalytics.filters.gender')]: 'gender',
    [t('reportsAnalytics.filters.ageBand')]: 'ageBand',
    [t('reportsAnalytics.filters.role')]: 'role',
    [t('reportsAnalytics.filters.region')]: 'regionId',
    [t('reportsAnalytics.filters.zone')]: 'zoneId',
    [t('reportsAnalytics.filters.team')]: 'teamId',
  }

  for (const filter of selectFilters) {
    if (!filter.value) continue
    const option = filter.options.find((o) => o.value === filter.value)
    const filterKey = filterKeyMap[filter.label]
    if (option && filterKey) {
      activeFilters.push({
        key: filter.label,
        label: `${filter.label}: ${option.label}`,
        onRemove: () => onFilterChange(filterKey, ''),
      })
    }
  }

  if (activeFilters.length === 0) return null

  return (
    <div className={styles.activeChips} aria-label={t('reportsAnalytics.filters.activeFilters')}>
      {activeFilters.map((chip) => (
        <span key={chip.key} className={styles.activeChip}>
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className={styles.chipRemove}
            aria-label={`${t('reportsAnalytics.filters.removeFilter')}: ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}

export function FiltersBar({
  data,
  filters,
  t,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading,
}: {
  data: ReportsAnalyticsResponse | null
  filters: ReportsAnalyticsFilters
  t: ReportsAnalyticsT
  onFilterChange: ReportsAnalyticsFilterUpdater
  onReset: () => void
  onRefresh: () => void
  isLoading: boolean
}) {
  const [showMore, setShowMore] = useState(false)

  const zones = useMemo(
    () => (data?.filterOptions.zones || []).filter((zone) => !filters.regionId || zone.regionId === filters.regionId),
    [data?.filterOptions.zones, filters.regionId],
  )
  const teams = useMemo(
    () =>
      (data?.filterOptions.teams || []).filter((team) => {
        if (filters.zoneId && team.zoneId !== filters.zoneId) return false
        if (filters.regionId && team.regionId !== filters.regionId) return false
        return true
      }),
    [data?.filterOptions.teams, filters.regionId, filters.zoneId],
  )

  const allFilters = buildSelectFilterDefinitions({ data, filters, t, onFilterChange, zones, teams })
  const [courseFilter, jobTitleFilter, genderFilter, ageBandFilter, roleFilter, statusFilter, regionFilter, zoneFilter, teamFilter] = allFilters

  const primarySelectFilters = [courseFilter, jobTitleFilter, statusFilter].filter(Boolean)
  const secondaryFilters = [genderFilter, ageBandFilter, roleFilter, regionFilter, zoneFilter, teamFilter].filter(Boolean)

  const hasSecondaryActive = secondaryFilters.some((f) => f.value)

  return (
    <section
      id="tour-reports-filters"
      className={styles.filtersSurface}
      aria-label={t('reportsAnalytics.filters.panelLabel')}
    >
      <div className={styles.filtersPrimary}>
        <DateFilter
          label={t('reportsAnalytics.filters.from')}
          value={filters.from}
          placeholder={t('reportsAnalytics.filters.from')}
          onChange={(value) => onFilterChange('from', value)}
        />
        <DateFilter
          label={t('reportsAnalytics.filters.to')}
          value={filters.to}
          placeholder={t('reportsAnalytics.filters.to')}
          onChange={(value) => onFilterChange('to', value)}
        />
        {primarySelectFilters.map((filter) => (
          <div key={filter.label}>
            <PremiumSelectFilter {...filter} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={`${styles.filterAction} ${styles.moreFilters}`}
          data-active={showMore || hasSecondaryActive}
          aria-expanded={showMore}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('reportsAnalytics.filters.moreFilters')}
          {hasSecondaryActive && (
            <span className={styles.filterCount}>
              {secondaryFilters.filter((f) => f.value).length}
            </span>
          )}
          {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showMore && (
        <div className={styles.filtersSecondary}>
          {secondaryFilters.map((filter) => (
            <div key={filter.label}>
              <PremiumSelectFilter {...filter} />
            </div>
          ))}
        </div>
      )}

      <ActiveChips
        selectFilters={allFilters}
        t={t}
        onFilterChange={onFilterChange}
      />

      <div className={styles.filtersFooter}>
        <GranularityControl value={filters.granularity} t={t} onChange={(value) => onFilterChange('granularity', value)} />
        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={styles.filterActionPrimary}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('reportsAnalytics.actions.refresh')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className={styles.filterAction}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('reportsAnalytics.actions.reset')}
          </button>
        </div>
      </div>
    </section>
  )
}
