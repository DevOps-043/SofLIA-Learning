import type { ReportsAnalyticsBreakdownItem } from './core.types'

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

export type ReportsAnalyticsHierarchyType = 'region' | 'zone' | 'team'

export interface ReportsAnalyticsHierarchyRankingRow {
  id: string
  type: ReportsAnalyticsHierarchyType
  name: string
  regionId?: string
  regionName?: string
  zoneId?: string
  zoneName?: string
  users: number
  averageProgress: number
  completionRate: number
  averageCompletionDays: number
  sofliaAdoptionRate: number
  notesAdoptionRate: number
  qualityScore: number
  overdueAssignments: number
  rankScore: number
}

export interface ReportsAnalyticsUserRankingRow {
  userId: string
  displayName: string
  email: string
  jobTitle: string
  regionName: string
  zoneName: string
  teamName: string
  averageProgress: number
  completionRate: number
  averageCompletionDays: number
  sofliaConversations: number
  notesCreated: number
  quizAverageScore: number
  qualityScore: number
  overdueAssignments: number
  rankScore: number
}

export interface ReportsAnalyticsRankings {
  regions: ReportsAnalyticsHierarchyRankingRow[]
  zones: ReportsAnalyticsHierarchyRankingRow[]
  teams: ReportsAnalyticsHierarchyRankingRow[]
  users: ReportsAnalyticsUserRankingRow[]
}

export interface ReportsAnalyticsDataQuality {
  usersWithCompleteDemographics: number
  usersMissingDemographics: number
  demographicsCompletionRate: number
  missingFields: ReportsAnalyticsBreakdownItem[]
}
