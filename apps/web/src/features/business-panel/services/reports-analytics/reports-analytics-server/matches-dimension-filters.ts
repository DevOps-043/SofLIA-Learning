import type { ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import type { UserDimension } from './user-dimension'

export function matchesDimensionFilters(dimension: UserDimension, filters: ReportsAnalyticsFilters): boolean {
  if (filters.gender && dimension.gender !== filters.gender) return false
  if (filters.ageBand && dimension.ageBand !== filters.ageBand) return false
  if (filters.jobTitle && dimension.jobTitle !== filters.jobTitle) return false
  if (filters.role && dimension.role !== filters.role) return false
  if (filters.status && dimension.status !== filters.status) return false
  if (filters.regionId && dimension.regionId !== filters.regionId) return false
  if (filters.zoneId && dimension.zoneId !== filters.zoneId) return false
  if (filters.teamId && dimension.teamId !== filters.teamId) return false
  return true
}
