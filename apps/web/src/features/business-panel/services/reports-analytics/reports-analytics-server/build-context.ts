import type { ReportsAnalyticsAiSample, ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import type { MutableCourseStats } from './mutable-course-stats'
import type { MutableUserStats } from './mutable-user-stats'
import type { OrganizationRegionRecord } from './organization-region-record'
import type { OrganizationTeamRecord } from './organization-team-record'
import type { OrganizationZoneRecord } from './organization-zone-record'
import type { UserDimension } from './user-dimension'

export interface BuildContext {
  users: Map<string, MutableUserStats>
  dimensions: UserDimension[]
  courses: Map<string, MutableCourseStats>
  regions: Map<string, OrganizationRegionRecord>
  zones: Map<string, OrganizationZoneRecord>
  teams: Map<string, OrganizationTeamRecord>
  completionTrendCounts: Map<string, number>
  filters: ReportsAnalyticsFilters
  aiSamples: ReportsAnalyticsAiSample[]
}
