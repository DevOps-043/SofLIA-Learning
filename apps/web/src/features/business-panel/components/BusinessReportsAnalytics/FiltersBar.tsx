import { RefreshCcw, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { PremiumDatePicker } from '../PremiumDatePicker'
import { buildSelectFilterDefinitions } from './filter-definitions'
import { GranularityControl } from './GranularityControl'
import { PremiumSelectFilter } from './PremiumSelectFilter'
import type { ReportsAnalyticsFilterUpdater, ReportsAnalyticsFilters, ReportsAnalyticsT, ThemeTokens } from './types'

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
  const zones = useMemo(() => (data?.filterOptions.zones || []).filter((zone) => !filters.regionId || zone.regionId === filters.regionId), [data?.filterOptions.zones, filters.regionId])
  const teams = useMemo(() => (data?.filterOptions.teams || []).filter((team) => {
    if (filters.zoneId && team.zoneId !== filters.zoneId) return false
    if (filters.regionId && team.regionId !== filters.regionId) return false
    return true
  }), [data?.filterOptions.teams, filters.regionId, filters.zoneId])
  const selectFilters = buildSelectFilterDefinitions({ data, filters, t, onFilterChange, zones, teams })

  return (
    <section className="rounded-xl border p-5 sm:p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DateFilter label={t('reportsAnalytics.filters.from')} value={filters.from} placeholder="Fecha inicio..." theme={theme} onChange={(value) => onFilterChange('from', value)} />
        <DateFilter label={t('reportsAnalytics.filters.to')} value={filters.to} placeholder="Fecha fin..." theme={theme} onChange={(value) => onFilterChange('to', value)} />
        {selectFilters.map((filter) => <PremiumSelectFilter key={filter.label} theme={theme} {...filter} />)}
      </div>
      <div className="mt-5 border-t pt-5" style={{ borderColor: theme.dividerColor }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <GranularityControl value={filters.granularity} theme={theme} t={t} onChange={(value) => onFilterChange('granularity', value)} />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onRefresh} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
              <RefreshCcw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {t('reportsAnalytics.actions.refresh')}
            </button>
            <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
              <RotateCcw className="h-4 w-4" />
              {t('reportsAnalytics.actions.reset')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function DateFilter({ label, value, placeholder, theme, onChange }: { label: string; value: string; placeholder: string; theme: ThemeTokens; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>{label}</span>
      <PremiumDatePicker value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}
