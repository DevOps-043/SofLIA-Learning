import type { ReportsAnalyticsBreakdownItem } from './common.types'

export interface ReportsAnalyticsSegmentRow {
  key: string
  label: string
  users: number
  averageProgress: number
  completionRate: number
  averageCompletionDays: number
  sofliaAdoptionRate: number
  notesAdoptionRate: number
  quizAverageScore: number
  qualityScore: number
}

export interface ReportsAnalyticsSegments {
  ageBands: ReportsAnalyticsSegmentRow[]
  gender: ReportsAnalyticsSegmentRow[]
  jobTitles: ReportsAnalyticsSegmentRow[]
  roles: ReportsAnalyticsSegmentRow[]
}

export interface ReportsAnalyticsDataQuality {
  usersWithCompleteDemographics: number
  usersMissingDemographics: number
  demographicsCompletionRate: number
  missingFields: ReportsAnalyticsBreakdownItem[]
}

export interface ReportsAnalyticsFilterOptions {
  courses: Array<{ value: string; label: string }>
  genders: Array<{ value: string; label: string }>
  ageBands: Array<{ value: string; label: string }>
  jobTitles: Array<{ value: string; label: string }>
  roles: Array<{ value: string; label: string }>
  statuses: Array<{ value: string; label: string }>
  regions: Array<{ value: string; label: string }>
  zones: Array<{ value: string; label: string; regionId?: string }>
  teams: Array<{ value: string; label: string; zoneId?: string; regionId?: string }>
}
