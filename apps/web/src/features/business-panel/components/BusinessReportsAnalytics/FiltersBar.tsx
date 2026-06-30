'use client'

import { ChevronDown, ChevronUp, RefreshCcw, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { PremiumDatePicker } from '../PremiumDatePicker'
import { buildSelectFilterDefinitions, type SelectFilterDefinition } from './filter-definitions'
import { GranularityControl } from './GranularityControl'
import { PremiumSelectFilter } from './PremiumSelectFilter'
import type { ReportsAnalyticsFilterUpdater, ReportsAnalyticsFilters, ReportsAnalyticsT, ThemeTokens } from './types'

function DateFilter({ label, value, placeholder, theme, onChange }: {
  label: string
  value: string
  placeholder: string
  theme: ThemeTokens
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>{label}</span>
      <PremiumDatePicker value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

function ActiveChips({ filters, selectFilters, t, theme, onFilterChange }: {
  filters: ReportsAnalyticsFilters
  selectFilters: SelectFilterDefinition[]
  t: ReportsAnalyticsT
  theme: ThemeTokens
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
    <div className="mt-2 flex flex-wrap gap-1.5">
      {activeFilters.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: theme.hoverBg, color: theme.textColor, border: `1px solid ${theme.borderColor}` }}
        >
          {chip.label}
          <button onClick={chip.onRemove} className="ml-0.5 rounded-full hover:opacity-70">
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
  theme,
  t,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading,
}: {
  data: ReportsAnalyticsResponse | null
  filters: ReportsAnalyticsFilters
  theme: ThemeTokens
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
    <section id="tour-reports-filters" className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-wrap items-end gap-3">
        <DateFilter
          label={t('reportsAnalytics.filters.from')}
          value={filters.from}
          placeholder="Fecha inicio"
          theme={theme}
          onChange={(value) => onFilterChange('from', value)}
        />
        <DateFilter
          label={t('reportsAnalytics.filters.to')}
          value={filters.to}
          placeholder="Fecha fin"
          theme={theme}
          onChange={(value) => onFilterChange('to', value)}
        />
        {primarySelectFilters.map((filter) => (
          <div key={filter.label} className="min-w-[140px]">
            <PremiumSelectFilter theme={theme} {...filter} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="inline-flex items-center gap-1.5 self-end rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
          style={{
            borderColor: showMore || hasSecondaryActive ? theme.actionColor : theme.borderColor,
            color: showMore || hasSecondaryActive ? theme.actionColor : theme.subtextColor,
            backgroundColor: showMore || hasSecondaryActive ? theme.actionSurface : 'transparent',
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('reportsAnalytics.filters.moreFilters') || 'Más filtros'}
          {hasSecondaryActive && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}>
              {secondaryFilters.filter((f) => f.value).length}
            </span>
          )}
          {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showMore && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3" style={{ borderColor: theme.dividerColor }}>
          {secondaryFilters.map((filter) => (
            <div key={filter.label} className="min-w-[140px]">
              <PremiumSelectFilter theme={theme} {...filter} />
            </div>
          ))}
        </div>
      )}

      <ActiveChips
        filters={filters}
        selectFilters={allFilters}
        t={t}
        theme={theme}
        onFilterChange={onFilterChange}
      />

      <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: theme.dividerColor }}>
        <GranularityControl value={filters.granularity} theme={theme} t={t} onChange={(value) => onFilterChange('granularity', value)} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('reportsAnalytics.actions.refresh')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: theme.borderColor, color: theme.textColor }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('reportsAnalytics.actions.reset')}
          </button>
        </div>
      </div>
    </section>
  )
}
