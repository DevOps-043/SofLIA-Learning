import type { ReportsAnalyticsAiSample } from './ai.types'
import type { ReportsAnalyticsFilters } from './core.types'
import type { ReportsAnalyticsFilterOptions } from './filter-options.types'
import type {
  ReportsAnalyticsActivities,
  ReportsAnalyticsCourseRow,
  ReportsAnalyticsDemographics,
  ReportsAnalyticsLearning,
  ReportsAnalyticsSoflia,
} from './learning.types'
import type { ReportsAnalyticsOverview } from './overview.types'
import type {
  ReportsAnalyticsConnectionCalendarCell,
  ReportsAnalyticsLoginHeatmapCell,
  ReportsAnalyticsNotes,
  ReportsAnalyticsPlanner,
  ReportsAnalyticsQuality,
} from './quality.types'
import type {
  ReportsAnalyticsDataQuality,
  ReportsAnalyticsRankings,
  ReportsAnalyticsSegments,
} from './rankings.types'

export interface ReportsAnalyticsResponse {
  success: true
  generatedAt: string
  period: { from: string; to: string }
  filters: ReportsAnalyticsFilters
  overview: ReportsAnalyticsOverview
  demographics: ReportsAnalyticsDemographics
  learning: ReportsAnalyticsLearning
  courses: ReportsAnalyticsCourseRow[]
  soflia: ReportsAnalyticsSoflia
  activities: ReportsAnalyticsActivities
  quality: ReportsAnalyticsQuality
  notes: ReportsAnalyticsNotes
  planner: ReportsAnalyticsPlanner
  loginHeatmap: ReportsAnalyticsLoginHeatmapCell[]
  connectionCalendar: ReportsAnalyticsConnectionCalendarCell[]
  segments: ReportsAnalyticsSegments
  rankings: ReportsAnalyticsRankings
  dataQuality: ReportsAnalyticsDataQuality
  filterOptions: ReportsAnalyticsFilterOptions
}

export interface ReportsAnalyticsUserDetailRow {
  userId: string
  displayName: string
  email: string
  status: string
  role: string
  jobTitle: string
  gender: string
  dateOfBirth: string
  age: number | null
  ageBand: string
  lastConnectionAt: string | null
  regionId: string
  regionName: string
  zoneId: string
  zoneName: string
  teamId: string
  teamName: string
  coursesAssigned: number
  coursesCompleted: number
  averageCompletionDays: number
  averageProgress: number
  overdueAssignments: number
  completedLessons: number
  timeSpentMinutes: number
  sofliaConversations: number
  sofliaMessages: number
  notesCreated: number
  activitiesCompleted: number
  activityAttempts: number
  quizAttempts: number
  quizAverageScore: number
  plannedSessions: number
  completedSessions: number
  missedSessions: number
  plannerAdherenceRate: number
  lastActivityAt: string | null
  qualityScore: number
}

export interface ReportsAnalyticsDataset extends ReportsAnalyticsResponse {
  userDetails: ReportsAnalyticsUserDetailRow[]
  aiSamples: ReportsAnalyticsAiSample[]
}
