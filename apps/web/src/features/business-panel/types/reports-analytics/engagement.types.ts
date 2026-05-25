import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsTrendPoint,
} from './common.types'

export interface ReportsAnalyticsSoflia {
  totalConversations: number
  totalMessages: number
  activeUsers: number
  averageMessagesPerConversation: number
  completionRate: number
  contextBreakdown: ReportsAnalyticsBreakdownItem[]
  conversationsTrend: ReportsAnalyticsTrendPoint[]
  conversationsByMonth: ReportsAnalyticsTrendPoint[]
}

export interface ReportsAnalyticsQuality {
  overallScore: number
  quizScore: number
  activityScore: number
  sofliaScore: number
  notesScore: number
  quizPassRate: number
  quizAverageScore: number
  activityCompletionRate: number
  helpRate: number
  redirectRate: number
  offTopicRate: number
  questionRate: number
  averageResponseTimeSeconds: number
  averageSentiment: number
  evidenceCount: number
  radar: ReportsAnalyticsBreakdownItem[]
}

export interface ReportsAnalyticsLoginHeatmapCell {
  dayKey: string
  dayIndex: number
  hour: number
  hourLabel: string
  value: number
  percentage: number
}

export interface ReportsAnalyticsConnectionCalendarCell {
  date: string
  dayKey: string
  dayIndex: number
  weekIndex: number
  monthKey: string
  monthLabel: string
  value: number
  level: 0 | 1 | 2 | 3 | 4
}
