import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { translateKey } from './translations'
import type { ReportsAnalyticsFilterUpdater, ReportsAnalyticsFilters, ReportsAnalyticsT } from './types'

export type SelectFilterDefinition = {
  value: string
  label: string
  options: Array<{ value: string; label: string }>
  allLabel: string
  onChange: (value: string) => void
}

export function buildSelectFilterDefinitions({
  data,
  filters,
  t,
  onFilterChange,
  zones,
  teams,
}: {
  data: ReportsAnalyticsResponse | null
  filters: ReportsAnalyticsFilters
  t: ReportsAnalyticsT
  onFilterChange: ReportsAnalyticsFilterUpdater
  zones: Array<{ value: string; label: string }>
  teams: Array<{ value: string; label: string }>
}): SelectFilterDefinition[] {
  const filterOptions = data?.filterOptions

  return [
    createFilter(filters.courseId, t('reportsAnalytics.filters.course'), filterOptions?.courses || [], t('reportsAnalytics.filters.allCourses'), (value) => onFilterChange('courseId', value)),
    createFilter(filters.jobTitle, t('reportsAnalytics.filters.jobTitle'), filterOptions?.jobTitles || [], t('reportsAnalytics.filters.allJobTitles'), (value) => onFilterChange('jobTitle', value)),
    createFilter(filters.gender, t('reportsAnalytics.filters.gender'), translateOptions(t, 'gender', filterOptions?.genders), t('reportsAnalytics.filters.allGenders'), (value) => onFilterChange('gender', value)),
    createFilter(filters.ageBand, t('reportsAnalytics.filters.ageBand'), translateOptions(t, 'ageBands', filterOptions?.ageBands), t('reportsAnalytics.filters.allAgeBands'), (value) => onFilterChange('ageBand', value)),
    createFilter(filters.role, t('reportsAnalytics.filters.role'), translateOptions(t, 'roles', filterOptions?.roles), t('reportsAnalytics.filters.allRoles'), (value) => onFilterChange('role', value)),
    createFilter(filters.status, t('reportsAnalytics.filters.status'), translateOptions(t, 'statuses', filterOptions?.statuses), t('reportsAnalytics.filters.allStatuses'), (value) => onFilterChange('status', value)),
    createFilter(filters.regionId, t('reportsAnalytics.filters.region'), filterOptions?.regions || [], t('reportsAnalytics.filters.allRegions'), (value) => onFilterChange('regionId', value)),
    createFilter(filters.zoneId, t('reportsAnalytics.filters.zone'), zones, t('reportsAnalytics.filters.allZones'), (value) => onFilterChange('zoneId', value)),
    createFilter(filters.teamId, t('reportsAnalytics.filters.team'), teams, t('reportsAnalytics.filters.allTeams'), (value) => onFilterChange('teamId', value)),
  ]
}

function createFilter(
  value: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  allLabel: string,
  onChange: (value: string) => void,
): SelectFilterDefinition {
  return { value, label, options, allLabel, onChange }
}

function translateOptions(
  t: ReportsAnalyticsT,
  group: string,
  options: Array<{ value: string; label: string }> | undefined,
) {
  return (options || []).map((item) => ({ ...item, label: translateKey(t, group, item.value) }))
}
